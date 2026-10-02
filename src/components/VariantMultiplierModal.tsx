import React, { useState, useRef, useEffect } from 'react';
import { BaseProduct, CatalogItem, FilamentColor, ImageType } from '../types';
import { FILAMENT_COLORS } from '../data/filaments';
import { recolorImage, loadImage, rgbToHex, detectDominantPlasticColor } from '../utils/recolorEngine';
import { 
  Sparkles, 
  Pipette, 
  ShieldCheck, 
  Hand, 
  Image as ImageIcon, 
  Check, 
  Upload, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Layers,
  ChevronRight,
  Info,
  Wand2,
  Shield,
  Maximize2
} from 'lucide-react';
import { ImageZoomLightbox } from './ImageZoomLightbox';

interface PhotoItem {
  id: string;
  label: string;
  url: string;
  type: ImageType;
}

interface VariantMultiplierProps {
  baseProducts: BaseProduct[];
  onAddProductsToCatalog: (newItems: CatalogItem[]) => void;
  onClose: () => void;
}

export const VariantMultiplier: React.FC<VariantMultiplierProps> = ({
  baseProducts,
  onAddProductsToCatalog,
  onClose,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    baseProducts[0]?.id || ''
  );

  const currentBaseProduct = baseProducts.find((p) => p.id === selectedProductId) || baseProducts[0];

  // Configuración de recoloreado
  const [sourceColor, setSourceColor] = useState<string>(currentBaseProduct?.sourceColorHex || '#e11d48');
  const [tolerance, setTolerance] = useState<number>(currentBaseProduct?.tolerance || 45);
  const [feather, setFeather] = useState<number>(currentBaseProduct?.feather || 15);
  const [protectSkin, setProtectSkin] = useState<boolean>(true);
  const [protectNeutrals, setProtectNeutrals] = useState<boolean>(true);

  // Lista de fotos del producto base (HASTA 10 FOTOS)
  const [photos, setPhotos] = useState<PhotoItem[]>(() => {
    if (currentBaseProduct?.images?.length) {
      return currentBaseProduct.images.map((img, idx) => ({
        id: img.id || `photo-${idx}`,
        label: img.label || (idx === 0 ? 'Foto 1: Portada (Estudio)' : idx === 1 ? 'Foto 2: En Mano (Escala)' : `Foto ${idx + 1}`),
        url: img.url,
        type: img.type || (idx === 0 ? 'cover' : idx === 1 ? 'hand' : 'detail'),
      }));
    }
    return [];
  });

  // Foto actualmente activa para previsualizar en pantalla
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  // Colores seleccionados para generar
  const [selectedColors, setSelectedColors] = useState<string[]>([
    'f-amarillo',
    'f-azul',
    'f-grafito',
    'f-verde-lima',
    'f-aqua',
  ]);

  // Filamento activo en la previsualización
  const [previewFilament, setPreviewFilament] = useState<FilamentColor>(FILAMENT_COLORS[0]);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string>('');
  const [isProcessingPreview, setIsProcessingPreview] = useState<boolean>(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; photoCurrent: number; photoTotal: number } | null>(null);

  // Modo Cuentagotas y Cuentagotas de Blindaje
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [isShieldDropperActive, setIsShieldDropperActive] = useState<boolean>(false);
  const [protectedColors, setProtectedColors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lightbox con Zoom de Alta Resolución
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

  // Datos editables del producto
  const [customTitle, setCustomTitle] = useState(currentBaseProduct?.title || '');
  const [customCategory, setCustomCategory] = useState(currentBaseProduct?.category || 'Figuras Articuladas');
  const [customPrice, setCustomPrice] = useState(currentBaseProduct?.basePrice || 8500);
  const [customDimensions, setCustomDimensions] = useState(currentBaseProduct?.dimensions || '14.5 cm de alto');
  const [customSku, setCustomSku] = useState(currentBaseProduct?.skuBase || 'DUM13');

  // Actualizar al cambiar producto base
  useEffect(() => {
    if (currentBaseProduct) {
      setSourceColor(currentBaseProduct.sourceColorHex);
      setTolerance(currentBaseProduct.tolerance);
      setFeather(currentBaseProduct.feather);
      setCustomTitle(currentBaseProduct.title);
      setCustomCategory(currentBaseProduct.category);
      setCustomPrice(currentBaseProduct.basePrice);
      setCustomDimensions(currentBaseProduct.dimensions);
      setCustomSku(currentBaseProduct.skuBase);

      const basePhotos = currentBaseProduct.images.map((img, idx) => ({
        id: img.id || `photo-${idx}`,
        label: img.label || (idx === 0 ? 'Foto 1: Portada (Estudio)' : idx === 1 ? 'Foto 2: En Mano (Escala)' : `Foto ${idx + 1}`),
        url: img.url,
        type: img.type || (idx === 0 ? 'cover' : idx === 1 ? 'hand' : 'detail'),
      }));
      setPhotos(basePhotos);
      setActivePhotoIndex(0);
    }
  }, [selectedProductId]);

  const activePhoto = photos[activePhotoIndex] || photos[0];

  // Recalcular previsualización en vivo para la foto activa
  useEffect(() => {
    let isCancelled = false;

    const updatePreview = async () => {
      if (!activePhoto?.url) return;
      setIsProcessingPreview(true);

      try {
        const img = await loadImage(activePhoto.url);
        if (isCancelled) return;

        const recolored = await recolorImage(img, {
          sourceColorHex: sourceColor,
          targetColorHex: previewFilament.hex,
          tolerance,
          feather,
          protectSkin,
          protectNeutrals,
          protectedColors,
        });

        if (!isCancelled) {
          setLivePreviewUrl(recolored);
        }
      } catch (err) {
        console.error('Error generando preview:', err);
      } finally {
        if (!isCancelled) setIsProcessingPreview(false);
      }
    };

    const timeoutId = setTimeout(updatePreview, 120);
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    activePhoto,
    sourceColor,
    previewFilament,
    tolerance,
    feather,
    protectSkin,
    protectNeutrals,
    protectedColors,
  ]);

  // Subir fotos múltiples (hasta 10 fotos)
  const handleMultipleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - photos.length;
    if (remainingSlots <= 0) {
      alert('Ya alcanzaste el límite máximo de 10 fotos por producto.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setPhotos((prev) => {
          if (prev.length >= 10) return prev;
          const nextIndex = prev.length + 1;
          const label =
            nextIndex === 1
              ? 'Foto 1: Portada (Estudio)'
              : nextIndex === 2
              ? 'Foto 2: En Mano (Escala)'
              : `Foto ${nextIndex}: Detalle / Ángulo`;

          const type: ImageType = nextIndex === 1 ? 'cover' : nextIndex === 2 ? 'hand' : 'detail';

          return [
            ...prev,
            {
              id: `user-photo-${Date.now()}-${i}`,
              label,
              url,
              type,
            },
          ];
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removePhoto = (indexToRemove: number) => {
    if (photos.length <= 1) {
      alert('El producto debe tener al menos una foto.');
      return;
    }
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (activePhotoIndex >= photos.length - 1) {
      setActivePhotoIndex(Math.max(0, photos.length - 2));
    }
  };

  const updatePhotoLabel = (index: number, newLabel: string) => {
    setPhotos((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, label: newLabel } : p))
    );
  };

  // Auto-detección inteligente del color de la pieza
  const handleAutoDetectColor = async () => {
    if (!activePhoto?.url) return;
    try {
      const img = await loadImage(activePhoto.url);
      const detectedHex = detectDominantPlasticColor(img);
      setSourceColor(detectedHex);
    } catch (err) {
      console.error('Error auto-detectando color:', err);
    }
  };

  // Cuentagotas manual por clic (para color base o blindaje)
  const handleCanvasClick = (e: React.MouseEvent<HTMLImageElement>) => {
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

  const toggleColor = (colorId: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
    );
  };

  // Generar lote de productos unitarios procesando TODAS las fotos subidas
  const handleGenerateBatch = async () => {
    if (selectedColors.length === 0 || photos.length === 0) return;

    setIsGeneratingBatch(true);
    setGenerationProgress({
      current: 0,
      total: selectedColors.length,
      photoCurrent: 0,
      photoTotal: photos.length,
    });

    try {
      // Pre-cargar todas las imágenes HTML en memoria
      const loadedImages = await Promise.all(
        photos.map(async (p) => {
          const img = await loadImage(p.url);
          return { item: p, htmlImage: img };
        })
      );

      const newCatalogItems: CatalogItem[] = [];

      for (let i = 0; i < selectedColors.length; i++) {
        const filamentId = selectedColors[i];
        const filament = FILAMENT_COLORS.find((f) => f.id === filamentId);
        if (!filament) continue;

        // Recolorear TODAS las fotos para esta variante (hasta 10)
        const recoloredPhotosList: { id: string; label: string; url: string; type: ImageType }[] = [];

        for (let j = 0; j < loadedImages.length; j++) {
          setGenerationProgress({
            current: i + 1,
            total: selectedColors.length,
            photoCurrent: j + 1,
            photoTotal: loadedImages.length,
          });

          const { item, htmlImage } = loadedImages[j];
          const recoloredUrl = await recolorImage(htmlImage, {
            sourceColorHex: sourceColor,
            targetColorHex: filament.hex,
            tolerance,
            feather,
            protectSkin,
            protectNeutrals,
            protectedColors,
          });

          recoloredPhotosList.push({
            id: `img-${Date.now()}-${filament.id}-${j}`,
            label: item.label,
            url: recoloredUrl,
            type: item.type,
          });
        }

        const skuSuffix = filament.name.substring(0, 3).toUpperCase();
        const coverImg = recoloredPhotosList[0]?.url || '';
        const handImg = recoloredPhotosList.find((p) => p.type === 'hand')?.url || recoloredPhotosList[1]?.url;

        newCatalogItems.push({
          id: `item-${Date.now()}-${filament.id}`,
          baseProductId: currentBaseProduct?.id || 'prod-custom',
          variantId: `var-${Date.now()}-${filament.id}`,
          title: `${customTitle} - ${filament.name}`,
          colorName: filament.name,
          colorHex: filament.hex,
          material: filament.material,
          category: customCategory,
          price: customPrice,
          sku: `${customSku}-${skuSuffix}`,
          inStock: true,
          description: `${currentBaseProduct?.description || ''} Color: ${filament.name} (${filament.material}).`,
          dimensions: customDimensions,
          coverImage: coverImg,
          handImage: handImg,
          images: recoloredPhotosList,
          createdAt: new Date().toISOString().split('T')[0],
        });
      }

      onAddProductsToCatalog(newCatalogItems);
      onClose();
    } catch (err) {
      console.error('Error al generar variantes por lote:', err);
    } finally {
      setIsGeneratingBatch(false);
      setGenerationProgress(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-7xl mx-auto my-4">
      {/* Encabezado */}
      <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-rose-600/30 text-rose-400 border border-rose-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              Multiplicador de Productos (Hasta 10 Fotos por Pieza)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Subí todas las fotos de tu pieza (portada, en mano para escala, de espaldas, accesorios). El motor <strong>recolorará todas las fotos automáticamente</strong> manteniendo tus dedos y partes oscuras protegidas.
          </p>
        </div>

        {/* Selector de Pieza Base */}
        <div className="flex items-center space-x-3">
          <label className="text-xs text-slate-400">Pieza 3D Base:</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="bg-slate-800 text-white text-xs font-medium rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            {baseProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* PANEL IZQUIERDO: Gestión de Fotos (hasta 10) y Ajustes de Motor (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Gestor de Fotos Subidas (Hasta 10 fotos) */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  Fotos de la Pieza ({photos.length} de 10)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Todas las fotos se recolorarán para cada variante elegida.
                </p>
              </div>

              {/* Botón para subir fotos adicionales */}
              {photos.length < 10 && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleMultipleFilesUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Subir Fotos</span>
                  </button>
                </div>
              )}
            </div>

            {/* Lista interactiva de fotos */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`flex items-center space-x-3 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    activePhotoIndex === idx
                      ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {/* Miniatura */}
                  <img
                    src={photo.url}
                    alt={photo.label}
                    className="w-10 h-10 object-contain rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0"
                  />

                  {/* Nombre / Etiqueta de la foto */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={photo.label}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updatePhotoLabel(idx, e.target.value)}
                      className="w-full text-xs font-semibold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-rose-500 focus:outline-none text-slate-800 dark:text-slate-200"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      {idx === 0
                        ? 'Portada principal'
                        : photo.type === 'hand'
                        ? '✋ Muestra escala en mano'
                        : 'Foto secundaria'}
                    </span>
                  </div>

                  {/* Botón eliminar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(idx);
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-md"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Color Base & Cuentagotas */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Pipette className="w-4 h-4 text-rose-600" />
                Color Base de la Pieza
              </h3>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleAutoDetectColor}
                  className="px-2 py-1 text-xs rounded-md font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center space-x-1 transition-colors"
                  title="Detecta automáticamente el color de la armadura 3D"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Auto-Detectar</span>
                </button>

                <button
                  onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                  className={`px-2 py-1 text-xs rounded-md font-semibold flex items-center space-x-1 transition-colors ${
                    isEyedropperActive
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  title="Hacé clic con el puntero en cualquier parte del plástico"
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span>{isEyedropperActive ? 'Tocá la foto' : 'Cuentagotas'}</span>
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
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {sourceColor.toUpperCase()}
                </span>
                <p className="text-[11px] text-slate-500">
                  Tomalo con el cuentagotas haciendo clic en la foto de la derecha.
                </p>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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

          {/* 3. Blindajes Biológicos y Neutros */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Blindajes de Seguridad Activos
            </h3>

            <label className="flex items-start space-x-3 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={protectSkin}
                onChange={(e) => setProtectSkin(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 accent-rose-600"
              />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ✋ Blindar Piel Humana (Manos y Dedos)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Aplica automáticamente a cualquier foto donde sostengas la pieza.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={protectNeutrals}
                onChange={(e) => setProtectNeutrals(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 accent-rose-600"
              />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  🛡️ Blindar Articulaciones Negras & Fondos
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Protegido por baja saturación, sin borrones ni reflejos distorsionados.
                </p>
              </div>
            </label>

            {/* 3.1 Cuentagotas de Blindaje (Congelar color específico) */}
            <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    Cuentagotas de Blindaje
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Congela detalles, logos o plantas para que no cambien.
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
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  title="Hacé clic en cualquier detalle de la foto que quieras congelar/blindar"
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span>{isShieldDropperActive ? 'Tocá la foto' : 'Blindar Color'}</span>
                </button>
              </div>

              {/* Lista de colores blindados */}
              {protectedColors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {protectedColors.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] shadow-xs"
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
        </div>

        {/* PANEL DERECHO: Previsualización en Vivo de la Foto Activa y Selección de Filamentos (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visor de Previsualización */}
          <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Previsualizando:
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: previewFilament.hex }}
                  />
                  {previewFilament.name}
                </span>
              </div>

              {/* Selector de qué foto se está previsualizando */}
              <div className="flex items-center space-x-1 bg-slate-800 p-0.5 rounded-lg text-xs overflow-x-auto max-w-xs">
                {photos.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-all ${
                      activePhotoIndex === idx
                        ? 'bg-rose-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Foto {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Comparación Lado a Lado: Original vs Recoloreado de la foto activa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate">{activePhoto?.label || 'Original'}</span>
                  <div className="flex items-center space-x-1.5">
                    {isEyedropperActive && (
                      <span className="text-rose-400 font-bold animate-pulse text-[11px]">
                        📍 Hacé clic para tomar color
                      </span>
                    )}
                    {isShieldDropperActive && (
                      <span className="text-blue-400 font-bold animate-pulse text-[11px]">
                        🛡️ Hacé clic para BLINDAR
                      </span>
                    )}
                    {activePhoto?.url && !isEyedropperActive && !isShieldDropperActive && (
                      <button
                        onClick={() =>
                          setLightboxState({
                            isOpen: true,
                            imageUrl: activePhoto.url,
                            title: activePhoto.label || 'Foto Original',
                          })
                        }
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Ver en grande con Zoom"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative group">
                  {activePhoto?.url && (
                    <>
                      <img
                        src={activePhoto.url}
                        alt="Original"
                        onClick={(e) => {
                          if (isEyedropperActive || isShieldDropperActive) {
                            handleCanvasClick(e);
                          } else {
                            setLightboxState({
                              isOpen: true,
                              imageUrl: activePhoto.url,
                              title: activePhoto.label || 'Foto Original',
                            });
                          }
                        }}
                        className={`w-full h-full object-contain ${
                          isEyedropperActive
                            ? 'cursor-crosshair ring-2 ring-rose-500'
                            : isShieldDropperActive
                            ? 'cursor-crosshair ring-2 ring-blue-500'
                            : 'cursor-zoom-in'
                        }`}
                      />
                      {!isEyedropperActive && !isShieldDropperActive && (
                        <div 
                          onClick={() =>
                            setLightboxState({
                              isOpen: true,
                              imageUrl: activePhoto.url,
                              title: activePhoto.label || 'Foto Original',
                            })
                          }
                          className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 hover:bg-black text-white text-[10px] font-semibold rounded-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Zoom</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Resultado Recoloreado */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> En {previewFilament.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    {isProcessingPreview ? (
                      <span className="flex items-center text-xs text-slate-400 gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Procesando
                      </span>
                    ) : livePreviewUrl ? (
                      <button
                        onClick={() =>
                          setLightboxState({
                            isOpen: true,
                            imageUrl: livePreviewUrl,
                            title: `Resultado en ${previewFilament.name}`,
                            compareImageUrl: activePhoto?.url,
                            compareTitle: 'Original',
                          })
                        }
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Ver en grande con Zoom y Comparador"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative group">
                  {livePreviewUrl ? (
                    <>
                      <img 
                        src={livePreviewUrl} 
                        alt="Preview" 
                        onClick={() =>
                          setLightboxState({
                            isOpen: true,
                            imageUrl: livePreviewUrl,
                            title: `Resultado en ${previewFilament.name}`,
                            compareImageUrl: activePhoto?.url,
                            compareTitle: 'Original',
                          })
                        }
                        className="w-full h-full object-contain cursor-zoom-in" 
                      />
                      <div 
                        onClick={() =>
                          setLightboxState({
                            isOpen: true,
                            imageUrl: livePreviewUrl,
                            title: `Resultado en ${previewFilament.name}`,
                            compareImageUrl: activePhoto?.url,
                            compareTitle: 'Original',
                          })
                        }
                        className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 hover:bg-black text-white text-[10px] font-semibold rounded-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Zoom & Comparar</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500">Cargando...</div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center pt-1">
              💡 Podés hacer clic en cualquiera de las {photos.length} fotos arriba para ver cómo queda en este color antes de multiplicar.
            </p>
          </div>

          {/* 4. Selector de Filamentos para el Lote */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Colores a Generar ({selectedColors.length} elegidos)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cada color creará un producto independiente con las {photos.length} fotos recoloreadas.
                </p>
              </div>

              <div className="flex items-center space-x-1.5 text-xs">
                <button
                  onClick={() => setSelectedColors(FILAMENT_COLORS.filter(c => c.category === 'basico').map(c => c.id))}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  Básicos (9)
                </button>
                <button
                  onClick={() => setSelectedColors(FILAMENT_COLORS.filter(c => c.category === 'pastel').map(c => c.id))}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  Pastel / Claros (8)
                </button>
                <button
                  onClick={() => setSelectedColors(FILAMENT_COLORS.filter(c => c.category === 'especial' || c.category === 'silk').map(c => c.id))}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  Especiales (8)
                </button>
                <button
                  onClick={() => setSelectedColors(FILAMENT_COLORS.map(c => c.id))}
                  className="px-2 py-1 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold"
                >
                  Todos (25)
                </button>
              </div>
            </div>

            {/* Swatches de Filamentos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1">
              {FILAMENT_COLORS.map((fil) => {
                const isSelected = selectedColors.includes(fil.id);
                const isPreview = previewFilament.id === fil.id;

                return (
                  <div
                    key={fil.id}
                    onClick={() => {
                      toggleColor(fil.id);
                      setPreviewFilament(fil);
                    }}
                    className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="relative">
                      <span
                        className="w-5 h-5 rounded-full border border-black/20 block shrink-0"
                        style={{ backgroundColor: fil.hex }}
                      />
                      {isSelected && (
                        <Check className="w-3 h-3 text-white absolute inset-0 m-auto drop-shadow-sm" />
                      )}
                    </div>

                    <div className="flex-1 truncate">
                      <span className="block truncate">{fil.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {fil.material}
                      </span>
                    </div>

                    {isPreview && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/60 px-1 rounded">
                        Ver
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botón de Ejecución del Multiplicador */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Se crearán <strong>{selectedColors.length} publicaciones unitarias</strong> con{' '}
              <strong>{photos.length} fotos procesadas cada una</strong> ({selectedColors.length * photos.length} fotos en total).
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                onClick={handleGenerateBatch}
                disabled={isGeneratingBatch || selectedColors.length === 0 || photos.length === 0}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all text-sm disabled:opacity-50"
              >
                {isGeneratingBatch ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      Color {generationProgress?.current}/{generationProgress?.total} (Foto {generationProgress?.photoCurrent}/{generationProgress?.photoTotal})...
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generar {selectedColors.length} Productos ({photos.length} fotos c/u)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal con Zoom de Alta Resolución */}
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
