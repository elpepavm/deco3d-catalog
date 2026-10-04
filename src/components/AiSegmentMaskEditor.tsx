import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Pipette, 
  Loader2, 
  CheckCircle2, 
  MousePointerClick,
  AlertCircle
} from 'lucide-react';
import { rgbToHex, loadImage } from '../utils/recolorEngine';
import { prepareImageForAi, segmentAtPoint, AiModelLoadProgress } from '../utils/aiSegmentationService';

interface AiSegmentMaskEditorProps {
  imageSrc: string;
  previewSrc: string;
  maskDataUrl?: string;
  onMaskChange: (newMaskDataUrl: string | undefined) => void;
  onPickColor: (hex: string) => void;
  isProcessing?: boolean;
}

export const AiSegmentMaskEditor: React.FC<AiSegmentMaskEditorProps> = ({
  imageSrc,
  previewSrc,
  maskDataUrl,
  onMaskChange,
  onPickColor,
  isProcessing = false,
}) => {
  const [modelStatus, setModelStatus] = useState<AiModelLoadProgress>({
    status: 'loading',
    message: 'Iniciando IA Segment Anything...',
  });

  const [isSegmenting, setIsSegmenting] = useState<boolean>(false);
  const [showMaskOverlay, setShowMaskOverlay] = useState<boolean>(false);
  const [coveragePct, setCoveragePct] = useState<number | null>(null);
  const [isDropperActive, setIsDropperActive] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);

  // Cargar imagen y preparar embeddings de IA
  useEffect(() => {
    if (!imageSrc) return;

    let isCancelled = false;

    loadImage(imageSrc).then((img) => {
      if (isCancelled) return;
      loadedImgRef.current = img;

      // Canvas base para cuentagotas
      const baseCanvas = baseCanvasRef.current;
      if (baseCanvas) {
        baseCanvas.width = img.width;
        baseCanvas.height = img.height;
        const bCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
        if (bCtx) bCtx.drawImage(img, 0, 0);
      }

      // Preparar embeddings con el modelo SAM
      prepareImageForAi(img, (progress) => {
        if (!isCancelled) {
          setModelStatus(progress);
        }
      });
    }).catch((err) => {
      console.error('Error cargando imagen para editor IA:', err);
      if (!isCancelled) {
        setModelStatus({ status: 'error', message: 'Error cargando la foto.' });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [imageSrc]);

  // Dibujar máscara guardada en el canvas de superposición
  useEffect(() => {
    const maskCanvas = maskCanvasRef.current;
    const img = loadedImgRef.current;
    if (!maskCanvas || !img) return;

    maskCanvas.width = img.width;
    maskCanvas.height = img.height;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, img.width, img.height);

    if (maskDataUrl) {
      loadImage(maskDataUrl).then((mImg) => {
        ctx.drawImage(mImg, 0, 0, img.width, img.height);
      }).catch(console.error);
    }
  }, [maskDataUrl]);

  // Coordenadas exactas en la imagen original
  const getImageCoords = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const img = loadedImgRef.current;
    if (!container || !img) return null;

    const rect = container.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calcular escala considerando object-contain dentro del contenedor
    const containerW = rect.width;
    const containerH = rect.height;
    const imgAspect = img.width / img.height;
    const containerAspect = containerW / containerH;

    let renderW = containerW;
    let renderH = containerH;
    let offsetX = 0;
    let offsetY = 0;

    if (containerAspect > imgAspect) {
      renderW = containerH * imgAspect;
      offsetX = (containerW - renderW) / 2;
    } else {
      renderH = containerW / imgAspect;
      offsetY = (containerH - renderH) / 2;
    }

    const relX = clientX - rect.left - offsetX;
    const relY = clientY - rect.top - offsetY;

    if (relX < 0 || relX > renderW || relY < 0 || relY > renderH) {
      return null;
    }

    const x = Math.floor((relX / renderW) * img.width);
    const y = Math.floor((relY / renderH) * img.height);

    return { x, y };
  };

  // Clic en la imagen: Cuentagotas o Segmentación IA con 1 clic
  const handleContainerClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getImageCoords(e);
    if (!coords) return;

    // 1. Tomar muestra inmediata del color exacto donde el usuario hizo clic
    const baseCanvas = baseCanvasRef.current;
    if (baseCanvas) {
      const bCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
      if (bCtx) {
        const pixel = bCtx.getImageData(coords.x, coords.y, 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        onPickColor(hex);
      }
    }

    // Si solo estaba activo el cuentagotas, terminamos aquí
    if (isDropperActive) {
      setIsDropperActive(false);
      return;
    }

    // 2. Segmentación IA con 1 clic
    if (modelStatus.status !== 'ready' || isSegmenting) return;

    setIsSegmenting(true);
    try {
      const existingCanvas = maskDataUrl ? maskCanvasRef.current : null;
      const result = await segmentAtPoint(coords.x, coords.y, existingCanvas);

      if (result) {
        setCoveragePct(result.coveragePercentage);
        onMaskChange(result.maskDataUrl);
      }
    } catch (err) {
      console.error('Error al segmentar con IA:', err);
    } finally {
      setIsSegmenting(false);
    }
  };

  // Limpiar máscara IA
  const handleClearMask = () => {
    setCoveragePct(null);
    onMaskChange(undefined);
  };

  return (
    <div className="space-y-2 flex flex-col select-none">
      {/* Barra de Estado y Herramientas */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs">
        {/* Estado del Modelo IA */}
        <div className="flex items-center space-x-2">
          {modelStatus.status === 'loading' ? (
            <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">{modelStatus.message || 'Cargando IA...'}</span>
            </div>
          ) : modelStatus.status === 'ready' ? (
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-[11px]">
                {maskDataUrl ? '✓ Pieza aislada por IA' : 'Hacé 1 clic sobre la pieza a teñir'}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-rose-500 font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[11px]">{modelStatus.message || 'Error de IA'}</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center space-x-1.5">
          {/* Cuentagotas */}
          <button
            type="button"
            onClick={() => setIsDropperActive(!isDropperActive)}
            className={`p-1.5 rounded-lg flex items-center space-x-1 font-semibold transition-all ${
              isDropperActive
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Cuentagotas: Tomar muestra de color original"
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>

          {maskDataUrl && (
            <>
              {/* Toggle Overlay Máscara */}
              <button
                type="button"
                onClick={() => setShowMaskOverlay(!showMaskOverlay)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showMaskOverlay ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={showMaskOverlay ? 'Ocultar máscara azul' : 'Ver contorno de máscara de IA'}
              >
                {showMaskOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              {/* Limpiar Selección */}
              <button
                type="button"
                onClick={handleClearMask}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                title="Limpiar máscara de IA y volver al modo estándar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Visor Interactivo con Click de IA */}
      <div 
        ref={containerRef}
        onClick={handleContainerClick}
        className={`relative aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner select-none ${
          isDropperActive 
            ? 'cursor-crosshair' 
            : modelStatus.status === 'ready' 
            ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all' 
            : 'cursor-wait'
        }`}
      >
        {/* Canvas de imagen original (invisible, para lectura cuentagotas) */}
        <canvas ref={baseCanvasRef} className="hidden" />

        {/* Imagen teñida de previsualización */}
        {previewSrc ? (
          <img
            src={previewSrc}
            alt="Previsualización teñida"
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <img
            src={imageSrc}
            alt="Original"
            className="w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Canvas de Máscara (para visualizar el recorte de IA si se activa el toggle) */}
        <canvas
          ref={maskCanvasRef}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-200 ${
            showMaskOverlay ? 'opacity-40 mix-blend-color-burn' : 'opacity-0'
          }`}
        />

        {/* Cartel de carga de IA */}
        {modelStatus.status === 'loading' && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
            <span className="text-white text-xs font-bold">
              {modelStatus.message || 'Cargando IA Segment Anything (15 MB)...'}
            </span>
            <span className="text-slate-400 text-[10px] mt-1 max-w-[240px]">
              Se descarga una sola vez y se guarda en tu navegador.
            </span>
          </div>
        )}

        {/* Indicador mientras la IA recorta */}
        {isSegmenting && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="p-3 bg-slate-900/95 text-white rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold border border-indigo-500/50">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>La IA está recortando la pieza 3D...</span>
            </div>
          </div>
        )}

        {/* Indicador de tinte en proceso */}
        {isProcessing && !isSegmenting && (
          <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-700 flex items-center space-x-1.5 pointer-events-none">
            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            <span>Tiñendo...</span>
          </div>
        )}
      </div>

      {/* Pie de Ayuda */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <MousePointerClick className="w-3.5 h-3.5 text-indigo-500" />
          {maskDataUrl ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Pieza aislada por IA con protección de detalles y fondo. Podés hacer clic en otra parte para sumarla.
            </span>
          ) : (
            'Hacé 1 clic sobre la pieza o componente que querés teñir. La IA la aislará automáticamente.'
          )}
        </span>

        {coveragePct !== null && (
          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
            {coveragePct}% del objeto
          </span>
        )}
      </div>
    </div>
  );
};
