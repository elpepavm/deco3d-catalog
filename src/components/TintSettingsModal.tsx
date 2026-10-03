import React, { useState, useEffect, useRef } from 'react';
import { InboxItem, FilamentColor } from '../types';
import { FILAMENT_COLORS } from '../data/filaments';
import { recolorImage, loadImage, rgbToHex, detectDominantPlasticColor } from '../utils/recolorEngine';
import { 
  X, 
  Pipette, 
  Sliders, 
  ShieldCheck, 
  Hand, 
  RefreshCw, 
  Sparkles, 
  Check,
  Eye,
  SlidersHorizontal
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

  // Filamento de prueba para la previsualización
  const [testFilament, setTestFilament] = useState<FilamentColor>(FILAMENT_COLORS[0]);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isProcessingPreview, setIsProcessingPreview] = useState<boolean>(false);
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

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

      if (item.sourceColorHex) {
        setSourceColor(item.sourceColorHex);
      } else {
        // Detectar automáticamente
        loadImage(item.sourceImage).then((img) => {
          const detected = detectDominantPlasticColor(img);
          setSourceColor(detected);
        });
      }
    }
  }, [item]);

  // Dibujar imagen original en el canvas para cuentagotas y previsualización
  useEffect(() => {
    if (!item || !isOpen) return;

    loadImage(item.sourceImage).then((img) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      setCanvasDimensions({ width: img.width, height: img.height });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
    });
  }, [item, isOpen]);

  // Generar previsualización cuando cambian los parámetros
  useEffect(() => {
    if (!item || !isOpen || !sourceColor) return;

    let isCancelled = false;
    setIsProcessingPreview(true);

    const timer = setTimeout(async () => {
      try {
        const img = await loadImage(item.sourceImage);
        const result = await recolorImage(img, {
          sourceColorHex: sourceColor,
          targetColorHex: testFilament.hex,
          tolerance,
          feather,
          protectSkin,
          protectNeutrals,
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
    }, 180);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [item, isOpen, sourceColor, testFilament, tolerance, feather, protectSkin, protectNeutrals]);

  if (!isOpen || !item) return null;

  // Cuentagotas al hacer clic sobre el canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

    setSourceColor(hex);
    setIsEyedropperActive(false);
  };

  const handleSave = () => {
    onSave({
      ...item,
      sourceColorHex: sourceColor,
      tolerance,
      feather,
      protectSkin,
      protectNeutrals,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Ajustes de Tinción y Cuentagotas
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

        {/* Contenido en 2 columnas: Vista previa a la izquierda, controles a la derecha */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda: Previsualización y Cuentagotas */}
          <div className="space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                Previsualización en Tiempo Real
              </span>

              {/* Botón Cuentagotas */}
              <button
                type="button"
                onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isEyedropperActive
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                }`}
              >
                <Pipette className="w-3.5 h-3.5" />
                <span>{isEyedropperActive ? 'Haz clic en la foto' : 'Usar Cuentagotas'}</span>
              </button>
            </div>

            {/* Contenedor de la Imagen */}
            <div className="relative aspect-square bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              {/* Canvas para cuentagotas (visible en modo cuentagotas) */}
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className={`max-w-full max-h-full object-contain ${
                  isEyedropperActive ? 'cursor-crosshair block' : 'hidden'
                }`}
              />

              {/* Imagen teñida de previsualización */}
              {!isEyedropperActive && previewDataUrl && (
                <img
                  src={previewDataUrl}
                  alt="Previsualización teñida"
                  className="max-w-full max-h-full object-contain"
                />
              )}

              {isProcessingPreview && (
                <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="p-2 bg-slate-900/90 text-white rounded-xl shadow-lg flex items-center space-x-2 text-xs font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Teñiendo previsualización...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selector de filamento de prueba */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Probar resultado con filamento:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
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
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Color Original Detectado de la Pieza
                </span>
                <div className="flex items-center space-x-2">
                  <span
                    className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 shadow-inner"
                    style={{ backgroundColor: sourceColor }}
                  />
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {sourceColor.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="color"
                  value={sourceColor}
                  onChange={(e) => setSourceColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  title="Elegir manualmente color de muestra"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Haz clic en el selector o activa el cuentagotas para tomar la muestra de la zona más iluminada.
                </span>
              </div>
            </div>

            {/* Tolerancia Angular */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tolerancia Angular de Matiz
                </label>
                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">
                  {tolerance}°
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="80"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Aumenta la tolerancia si la pieza tiene biseles o sombras que no se están tiñendo del todo.
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
                Difumina los contornos para eliminar serruchos y halos de color original.
              </p>
            </div>

            {/* Blindajes Inteligentes */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Blindajes Inteligentes
              </span>

              {/* Blindaje de Piel */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={protectSkin}
                  onChange={(e) => setProtectSkin(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Hand className="w-3.5 h-3.5 text-amber-500" />
                    Blindaje de Piel Humana (Fotos en Mano)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Evita que los dedos o la palma de la mano se tiñan al cambiar el color del modelo.
                  </p>
                </div>
              </label>

              {/* Blindaje de Neutrales */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={protectNeutrals}
                  onChange={(e) => setProtectNeutrals(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Blindaje de Articulaciones Negras y Fondo
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Conserva las partes negras/grises (articulaciones, armas, accesorios) y el fondo blanco o gris.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium text-xs transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl font-bold text-xs shadow-md bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-indigo-600/20 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Ajustes de Tinción</span>
          </button>
        </div>
      </div>
    </div>
  );
};
