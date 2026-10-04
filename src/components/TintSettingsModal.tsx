import React, { useState, useEffect, useRef } from 'react';
import { InboxItem, FilamentColor } from '../types';
import { FILAMENT_COLORS } from '../data/filaments';
import { recolorImage, loadImage, detectDominantPlasticColor } from '../utils/recolorEngine';
import { AiSegmentMaskEditor } from './AiSegmentMaskEditor';
import { 
  X, 
  ShieldCheck, 
  Hand, 
  Check,
  Eye,
  SlidersHorizontal,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface TintSettingsModalProps {
  isOpen: boolean;
  item: InboxItem | null;
  onClose: () => void;
  onSave: (updatedItem: InboxItem) => void;
}

export const TintSettingsModal: React.FC<TintSettingsModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
}) => {
  const [sourceColor, setSourceColor] = useState<string>('#00A896');
  const [tolerance, setTolerance] = useState<number>(45);
  const [feather, setFeather] = useState<number>(15);
  const [protectSkin, setProtectSkin] = useState<boolean>(true);
  const [protectNeutrals, setProtectNeutrals] = useState<boolean>(true);
  const [maskDataUrl, setMaskDataUrl] = useState<string | undefined>(undefined);

  // Filamento de prueba para la previsualización
  const [testFilament, setTestFilament] = useState<FilamentColor>(FILAMENT_COLORS[0]);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isProcessingPreview, setIsProcessingPreview] = useState<boolean>(false);

  const previewImgRef = useRef<HTMLCanvasElement | null>(null);

  // Cargar datos del item
  useEffect(() => {
    if (item) {
      const initialTol = item.tolerance ?? 45;
      const initialFeather = item.feather ?? 15;
      const initialSkin = item.protectSkin ?? true;
      const initialNeutrals = item.protectNeutrals ?? true;

      setTolerance(initialTol);
      setFeather(initialFeather);
      setProtectSkin(initialSkin);
      setProtectNeutrals(initialNeutrals);
      setMaskDataUrl(item.maskDataUrl);

      if (item.sourceColorHex && item.sourceColorHex.toUpperCase() !== '#00A896') {
        setSourceColor(item.sourceColorHex);
      } else {
        // Detectar automáticamente color real
        loadImage(item.sourceImage).then((img) => {
          const detected = detectDominantPlasticColor(img);
          setSourceColor(detected);
        }).catch(() => setSourceColor('#E5E5E5'));
      }
    }
  }, [item]);

  // Dibujar imagen original en canvas optimizado para preview en tiempo real
  useEffect(() => {
    if (!item || !isOpen) return;

    loadImage(item.sourceImage).then((img) => {
      // Canvas optimizado para previsualización a 60fps (máx 520px)
      const maxDim = 520;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const pCanvas = document.createElement('canvas');
      pCanvas.width = w;
      pCanvas.height = h;
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        pCtx.drawImage(img, 0, 0, w, h);
      }
      previewImgRef.current = pCanvas;
    }).catch(console.error);
  }, [item, isOpen]);

  // Generar previsualización ultrarrápida cuando cambian los parámetros
  useEffect(() => {
    if (!item || !isOpen || !sourceColor) return;

    let isCancelled = false;
    setIsProcessingPreview(true);

    const timer = setTimeout(async () => {
      try {
        const sourceForPreview = previewImgRef.current || (await loadImage(item.sourceImage));
        const result = await recolorImage(sourceForPreview, {
          sourceColorHex: sourceColor,
          targetColorHex: testFilament.hex,
          tolerance,
          feather,
          protectSkin,
          protectNeutrals,
          maskDataUrl,
        });

        if (!isCancelled) {
          setPreviewDataUrl(result);
        }
      } catch (err) {
        console.error('Error al generar previsualización de tinte:', err);
      } finally {
        if (!isCancelled) {
          setIsProcessingPreview(false);
        }
      }
    }, 40); // 40ms: respuesta fluida inmediata en tiempo real

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [item, isOpen, sourceColor, testFilament, tolerance, feather, protectSkin, protectNeutrals, maskDataUrl]);

  if (!isOpen || !item) return null;

  const handleSave = () => {
    onSave({
      ...item,
      sourceColorHex: sourceColor,
      tolerance,
      feather,
      protectSkin,
      protectNeutrals,
      maskDataUrl,
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setTolerance(45);
    setFeather(15);
    setProtectSkin(true);
    setProtectNeutrals(true);
    setMaskDataUrl(undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Ajustes de Tinción e IA Segment Anything</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Meta AI SAM
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modelo: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido en 2 columnas: Vista previa / IA a la izquierda, controles a la derecha */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda: Editor IA Segment Anything y Previsualización */}
          <div className="space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                Segmentación con IA (1 Clic)
              </span>
            </div>

            {/* Editor de IA Interactivo */}
            <AiSegmentMaskEditor
              imageSrc={item.sourceImage}
              previewSrc={previewDataUrl}
              maskDataUrl={maskDataUrl}
              onMaskChange={(newMask) => setMaskDataUrl(newMask)}
              onPickColor={(hex) => setSourceColor(hex)}
              isProcessing={isProcessingPreview}
            />

            {/* Selector de filamento de prueba */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Probar resultado con filamento de prueba:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                {FILAMENT_COLORS.map((fil) => (
                  <button
                    key={fil.id}
                    type="button"
                    onClick={() => setTestFilament(fil)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      testFilament.id === fil.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-2 ring-indigo-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: fil.hex }}
                    />
                    <span className="truncate max-w-[70px]">{fil.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Parámetros del Motor de Color */}
          <div className="space-y-4">
            {/* Color Base Original */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Color Base Original de la Pieza
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Color de referencia de la foto base.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className="w-6 h-6 rounded-full border border-black/20 shadow-inner"
                    style={{ backgroundColor: sourceColor }}
                  />
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {sourceColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Tolerancia Angular */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tolerancia de Cobertura
                </label>
                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">
                  {tolerance}°
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Afecta al modo automático si no se usó la segmentación por IA.
              </p>
            </div>

            {/* Suavizado / Feather */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Suavizado de Bordes (Feather)
                </label>
                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">
                  {feather} px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                value={feather}
                onChange={(e) => setFeather(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Difumina suavemente los contornos para una integración natural.
              </p>
            </div>

            {/* Blindajes Inteligentes */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Filtros Automáticos de Blindaje
              </span>

              {/* Blindar Articulaciones / Neutros */}
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={protectNeutrals}
                  onChange={(e) => setProtectNeutrals(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Blindar articulaciones negras y fondo blanco
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Aísla el fondo blanco puro y las articulaciones de PETG negro.
                  </p>
                </div>
              </label>

              {/* Blindar Piel Humana */}
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={protectSkin}
                  onChange={(e) => setProtectSkin(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Hand className="w-3.5 h-3.5 text-amber-500" />
                    Blindaje de Piel Humana (Fotos en Mano)
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Protege dedos y palmas en fotos de escala.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer parámetros</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Ajustes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
