import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FILAMENT_COLORS } from '../data/filaments';
import { createDummy13HandImage, createDummy13StudioImage, createPlanterHandImage } from '../data/sampleImages';
import { recolorImage, loadImage, rgbToHex, detectDominantPlasticColor } from '../utils/recolorEngine';
import { 
  Sparkles, 
  Pipette, 
  ShieldCheck, 
  Download, 
  Upload, 
  RefreshCw, 
  ZoomIn, 
  SplitSquareHorizontal,
  Hand,
  CheckCircle2,
  Info,
  Wand2,
  Shield,
  Maximize2
} from 'lucide-react';
import { ImageZoomLightbox } from './ImageZoomLightbox';

export const ColorStudioPlayground: React.FC = () => {
  // Ejemplos precargados memorizados
  const dummyHand = useMemo(() => createDummy13HandImage('#e11d48'), []);
  const dummyStudio = useMemo(() => createDummy13StudioImage('#e11d48'), []);
  const planterHand = useMemo(() => createPlanterHandImage('#2563eb'), []);

  const [currentImageSrc, setCurrentImageSrc] = useState<string>(dummyHand);
  const [sourceColor, setSourceColor] = useState<string>('#e11d48');
  const [targetColor, setTargetColor] = useState<string>(FILAMENT_COLORS[0].hex); // Amarillo Sol
  const [targetColorName, setTargetColorName] = useState<string>(FILAMENT_COLORS[0].name);

  const [tolerance, setTolerance] = useState<number>(45);
  const [feather, setFeather] = useState<number>(15);
  const [protectSkin, setProtectSkin] = useState<boolean>(true);
  const [protectNeutrals, setProtectNeutrals] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultImageSrc, setResultImageSrc] = useState<string>('');
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [isShieldDropperActive, setIsShieldDropperActive] = useState<boolean>(false);
  const [protectedColors, setProtectedColors] = useState<string[]>([]);

  // Slider de comparación Antes/Después
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side'>('split');

  // Lightbox con Zoom
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    compareImageUrl?: string;
    compareTitle?: string;
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Procesar imagen
  useEffect(() => {
    let cancelled = false;

    const process = async () => {
      setIsProcessing(true);
      try {
        const img = await loadImage(currentImageSrc);
        if (cancelled) return;

        const output = await recolorImage(img, {
          sourceColorHex: sourceColor,
          targetColorHex: targetColor,
          tolerance,
          feather,
          protectSkin,
          protectNeutrals,
          protectedColors,
        });

        if (!cancelled) {
          setResultImageSrc(output);
        }
      } catch (err) {
        console.error('Error procesando imagen en el estudio:', err);
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    };

    const timer = setTimeout(process, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentImageSrc, sourceColor, targetColor, tolerance, feather, protectSkin, protectNeutrals, protectedColors]);

  // Manejo de cuentagotas al hacer clic sobre la imagen (origen o blindaje)
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperActive && !isShieldDropperActive) return;

    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * img.naturalWidth);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * img.naturalHeight);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

    if (isShieldDropperActive) {
      if (!protectedColors.includes(hex)) {
        setProtectedColors((prev) => [...prev, hex]);
      }
      setIsShieldDropperActive(false);
      return;
    }

    if (isEyedropperActive) {
      setSourceColor(hex);
      setIsEyedropperActive(false);
    }
  };

  const handleAutoDetect = async () => {
    try {
      const img = await loadImage(currentImageSrc);
      const detected = detectDominantPlasticColor(img);
      setSourceColor(detected);
    } catch (e) {
      console.error('Error auto-detectando color:', e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setCurrentImageSrc(url);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!resultImageSrc) return;
    const link = document.createElement('a');
    link.download = `pieza-3d-${targetColorName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = resultImageSrc;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border border-rose-900/40 rounded-2xl p-5 shadow-sm text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Banco de Pruebas
            </span>
            <h2 className="text-lg font-bold">Estudio de Recoloreado & Protección de Manos</h2>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Espacio de laboratorio para probar con cualquier foto de tu taller (muñecos, macetas, soportes, etc.). Podés inspeccionar cómo el algoritmo <strong>separa la mano humana del plástico 3D</strong> y protege las articulaciones oscuras.
          </p>
        </div>

        {/* Cargar foto propia */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 shadow transition-all text-xs"
          >
            <Upload className="w-4 h-4 text-rose-600" />
            <span>Subir Cualquier Foto de tu Cámara</span>
          </button>
        </div>
      </div>

      {/* Ejemplos Rápidos */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold shrink-0">Probar ejemplo rápido:</span>
        <button
          onClick={() => {
            setCurrentImageSrc(dummyHand);
            setSourceColor('#e11d48');
          }}
          className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition-colors ${
            currentImageSrc === dummyHand
              ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Dummy 13 en la Mano (Escala)</span>
        </button>

        <button
          onClick={() => {
            setCurrentImageSrc(dummyStudio);
            setSourceColor('#e11d48');
          }}
          className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition-colors ${
            currentImageSrc === dummyStudio
              ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span>Dummy 13 Portada (Fondo Blanco)</span>
        </button>

        <button
          onClick={() => {
            setCurrentImageSrc(planterHand);
            setSourceColor('#2563eb');
          }}
          className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition-colors ${
            currentImageSrc === planterHand
              ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Maceta Suculenta en la Mano</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controles de imagen (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Color Origen y Cuentagotas */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Pipette className="w-4 h-4 text-rose-600" />
                Color de Origen
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleAutoDetect}
                  className="px-2 py-1 text-xs rounded-md font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center space-x-1 transition-colors"
                  title="Detectar automáticamente el color del plástico"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Auto</span>
                </button>

                <button
                  onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                  className={`px-2 py-1 text-xs rounded-md font-semibold transition-all ${
                    isEyedropperActive
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                  title="Hacé clic sobre cualquier parte del plástico en la foto"
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span>{isEyedropperActive ? 'Clic' : 'Cuentagotas'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={sourceColor}
                onChange={(e) => setSourceColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
              />
              <div className="flex-1">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {sourceColor.toUpperCase()}
                </span>
                <p className="text-[11px] text-slate-500">
                  {isEyedropperActive
                    ? 'Tocá la zona de color de la pieza en la foto'
                    : 'Clic en cuentagotas para tomarlo directo'}
                </p>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <span>Tolerancia de Color:</span>
                  <span className="font-bold text-rose-600">{tolerance}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="85"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <span>Suavizado de Bordes (Feathering):</span>
                  <span className="font-bold text-rose-600">{feather}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  value={feather}
                  onChange={(e) => setFeather(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>
            </div>
          </div>

          {/* Blindajes */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Blindajes Biológicos & Físicos
            </span>

            <label className="flex items-start space-x-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={protectSkin}
                onChange={(e) => setProtectSkin(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 accent-rose-600"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ✋ Blindar Piel Humana (Manos y Dedos)
                </span>
                <p className="text-[11px] text-slate-500">
                  Preserva palma, nudillos y dedos aún al recolorear a tonos amarillos, naranjas o rojos.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={protectNeutrals}
                onChange={(e) => setProtectNeutrals(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 accent-rose-600"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  🛡️ Blindar Articulaciones Negras & Fondos
                </span>
                <p className="text-[11px] text-slate-500">
                  Impide que el negro mate o las sombras adquieran reflejos o halos teñidos.
                </p>
              </div>
            </label>

            {/* Cuentagotas de Blindaje */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    Cuentagotas de Blindaje
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Congela detalles que no quieras teñir (plantas, logos, ojos).
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsShieldDropperActive(!isShieldDropperActive);
                    if (isEyedropperActive) setIsEyedropperActive(false);
                  }}
                  className={`px-2 py-1 text-xs rounded-md font-semibold flex items-center space-x-1 transition-all ${
                    isShieldDropperActive
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                  title="Hacé clic en cualquier detalle de la foto para blindarlo"
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span>{isShieldDropperActive ? 'Tocá la foto' : 'Blindar'}</span>
                </button>
              </div>

              {/* Lista de colores blindados */}
              {protectedColors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {protectedColors.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {color.toUpperCase()}
                      </span>
                      <button
                        onClick={() => setProtectedColors(protectedColors.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 font-bold ml-1"
                        title="Eliminar este blindaje"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setProtectedColors([])}
                    className="text-[10px] text-slate-400 hover:text-rose-500 underline ml-1"
                  >
                    Borrar todos
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Selector de Nuevo Filamento */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Seleccionar Filamento Destino
            </span>

            <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1">
              {FILAMENT_COLORS.map((fil) => (
                <button
                  key={fil.id}
                  onClick={() => {
                    setTargetColor(fil.hex);
                    setTargetColorName(fil.name);
                  }}
                  className={`flex flex-col items-center p-2 rounded-lg border text-[11px] transition-all ${
                    targetColor === fil.hex
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 mb-1"
                    style={{ backgroundColor: fil.hex }}
                  />
                  <span className="truncate w-full text-center">{fil.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visor Interactivo (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between space-y-4">
          {/* Barra superior de visor */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">Modo de Vista:</span>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center space-x-1 ${
                  viewMode === 'split' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <SplitSquareHorizontal className="w-3.5 h-3.5" />
                <span>Cortina Antes / Después</span>
              </button>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 rounded-md text-xs font-medium ${
                  viewMode === 'side-by-side' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Lado a Lado
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setLightboxState({
                    isOpen: true,
                    imageUrl: resultImageSrc || currentImageSrc,
                    title: `Pieza en ${targetColorName}`,
                    compareImageUrl: currentImageSrc,
                    compareTitle: 'Original',
                  })
                }
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors border border-slate-700 shadow-sm"
                title="Ver en grande con Zoom interactivo"
              >
                <Maximize2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Zoom & Pantalla Completa</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar PNG</span>
              </button>
            </div>
          </div>

          {/* Área de Imagen */}
          <div className="relative aspect-square max-h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center select-none">
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-20">
                <div className="flex items-center space-x-2 text-xs font-semibold text-rose-400 bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando píxeles...</span>
                </div>
              </div>
            )}

            {viewMode === 'split' ? (
              // Vista de Cortina (Slider)
              <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                {/* Imagen Resultante de Fondo */}
                <img
                  src={resultImageSrc || currentImageSrc}
                  alt="Recoloreado"
                  className="w-full h-full object-contain"
                />

                {/* Imagen Original Recortada por el Slider */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={currentImageSrc}
                    alt="Original"
                    onClick={handleImageClick}
                    className={`w-full h-full object-contain max-w-none ${
                      isEyedropperActive ? 'cursor-crosshair' : ''
                    }`}
                    style={{ width: '100%', height: '100%' }}
                  />
                  <div className="absolute top-3 left-3 bg-black/75 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                    Original
                  </div>
                </div>

                <div className="absolute top-3 right-3 bg-rose-600/90 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                  Variante {targetColorName}
                </div>

                {/* Línea divisoria interactiva */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg text-[10px] font-bold">
                    ↔
                  </div>
                </div>

                {/* Slider range transparente para arrastrar */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
                />
              </div>
            ) : (
              // Vista Lado a Lado
              <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
                <div className="relative h-full flex items-center justify-center bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                  <img
                    src={currentImageSrc}
                    alt="Original"
                    onClick={handleImageClick}
                    className={`w-full h-full object-contain ${
                      isEyedropperActive
                        ? 'cursor-crosshair ring-2 ring-rose-500'
                        : isShieldDropperActive
                        ? 'cursor-crosshair ring-2 ring-blue-500'
                        : ''
                    }`}
                  />
                  <span className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                    Original
                  </span>
                </div>

                <div className="relative h-full flex items-center justify-center bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                  <img
                    src={resultImageSrc || currentImageSrc}
                    alt="Resultado"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute top-2 right-2 bg-rose-600 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                    {targetColorName}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Feedback & Explicación Técnica */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3 text-xs text-slate-300">
            <Info className="w-5 h-5 text-indigo-400 shrink-0" />
            <p>
              <strong>¿Cómo funciona el blindaje?</strong> Los píxeles de la mano tienen firmas cromáticas específicas en el canal YCbCr. El motor los aísla matemáticamente del filamento de la pieza, evitando que los dedos o la palma cambien de tono cuando la pieza se recolora.
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox con Zoom de Alta Resolución */}
      <ImageZoomLightbox
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={lightboxState.imageUrl}
        title={lightboxState.title}
        compareImageUrl={lightboxState.compareImageUrl}
        compareTitle={lightboxState.compareTitle}
      />
    </div>
  );
};
