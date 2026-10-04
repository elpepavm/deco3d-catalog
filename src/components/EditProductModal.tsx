import React, { useState, useEffect, useRef } from 'react';
import { CatalogItem, FilamentColor } from '../types';
import { CATEGORIES, FILAMENT_COLORS } from '../data/filaments';
import { recolorImage, loadImage, rgbToHex, detectDominantPlasticColor } from '../utils/recolorEngine';
import { AiSegmentMaskEditor } from './AiSegmentMaskEditor';
import { 
  X, 
  Save, 
  Tag, 
  DollarSign, 
  Layers, 
  AlignLeft, 
  Info, 
  Palette, 
  Pipette, 
  SlidersHorizontal, 
  ShieldCheck, 
  Hand, 
  RefreshCw, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Eye,
  CheckCircle2
} from 'lucide-react';

interface EditProductModalProps {
  isOpen: boolean;
  item: CatalogItem | null;
  onClose: () => void;
  onSave: (updatedItem: CatalogItem) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'color'>('details');

  // Datos del producto
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<string>('');
  const [sku, setSku] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [inStock, setInStock] = useState<boolean>(true);

  // Datos de Color y Tinción
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#eab308');
  const [autoUpdateTitleColor, setAutoUpdateTitleColor] = useState<boolean>(true);

  // Parámetros del motor de imagen
  const [sourceColor, setSourceColor] = useState<string>('#959b2a');
  const [tolerance, setTolerance] = useState<number>(45);
  const [feather, setFeather] = useState<number>(15);
  const [protectSkin, setProtectSkin] = useState<boolean>(true);
  const [protectNeutrals, setProtectNeutrals] = useState<boolean>(true);
  const [maskDataUrl, setMaskDataUrl] = useState<string | undefined>(undefined);

  // Imágenes
  const [currentCoverImage, setCurrentCoverImage] = useState<string>('');
  const [baseSourceImage, setBaseSourceImage] = useState<string>('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isProcessingPreview, setIsProcessingPreview] = useState<boolean>(false);
  const [isApplyingTint, setIsApplyingTint] = useState<boolean>(false);
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [tintAppliedSuccess, setTintAppliedSuccess] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewImgRef = useRef<HTMLCanvasElement | null>(null);

  // Cargar datos del producto al abrir el modal
  useEffect(() => {
    if (item && isOpen) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setCategory(item.category || 'Dummys');
      setPrice(item.price || 0);
      setSalePrice(item.salePrice ? String(item.salePrice) : '');
      setSku(item.sku || '');
      setDimensions(item.dimensions || '');
      setInStock(item.inStock ?? true);

      setColorName(item.colorName || 'Color Estándar');
      setColorHex(item.colorHex || '#eab308');

      // Imagen base para re-teñir (si no tiene sourceImage, usa coverImage)
      const baseImg = item.sourceImage || item.coverImage;
      setBaseSourceImage(baseImg);
      setCurrentCoverImage(item.coverImage);

      const initialTol = item.tolerance ?? 45;
      const initialFeather = item.feather ?? 15;
      const initialSkin = item.protectSkin ?? true;
      const initialNeutrals = item.protectNeutrals ?? true;

      setTolerance(initialTol);
      setFeather(initialFeather);
      setProtectSkin(initialSkin);
      setProtectNeutrals(initialNeutrals);
      setMaskDataUrl(item.maskDataUrl);
      setTintAppliedSuccess(false);

      if (item.sourceColorHex && item.sourceColorHex.toUpperCase() !== '#00A896') {
        setSourceColor(item.sourceColorHex);
      } else {
        // Detectar color base real
        loadImage(baseImg).then((img) => {
          const detected = detectDominantPlasticColor(img);
          setSourceColor(detected);
        }).catch(() => setSourceColor('#E5E5E5'));
      }
    }
  }, [item, isOpen]);

  // Preparar canvas optimizado para previsualización a 60fps
  useEffect(() => {
    if (!baseSourceImage || !isOpen) return;

    loadImage(baseSourceImage).then((img) => {
      // 1. Canvas para cuentagotas de alta resolución
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
      }

      // 2. Canvas optimizado de previsualización (máx 500px)
      const maxDim = 500;
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
      if (pCtx) pCtx.drawImage(img, 0, 0, w, h);
      previewImgRef.current = pCanvas;
    }).catch(console.error);
  }, [baseSourceImage, isOpen]);

  // Previsualización en tiempo real al cambiar parámetros de color o imagen
  useEffect(() => {
    if (!baseSourceImage || !isOpen || !sourceColor || !colorHex) return;

    let isCancelled = false;
    setIsProcessingPreview(true);

    const timer = setTimeout(async () => {
      try {
        const sourceToUse = previewImgRef.current || (await loadImage(baseSourceImage));
        const result = await recolorImage(sourceToUse, {
          sourceColorHex: sourceColor,
          targetColorHex: colorHex,
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
        console.error('Error generando previsualización de tinte:', err);
      } finally {
        if (!isCancelled) {
          setIsProcessingPreview(false);
        }
      }
    }, 40);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [baseSourceImage, isOpen, sourceColor, colorHex, tolerance, feather, protectSkin, protectNeutrals, maskDataUrl]);

  if (!isOpen || !item) return null;

  // Clic con cuentagotas en el canvas
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

  // Seleccionar un filamento oficial de la lista
  const handleSelectFilament = (fil: FilamentColor) => {
    const oldColorName = colorName;
    setColorName(fil.name);
    setColorHex(fil.hex);

    // Si está marcado auto-actualizar título y el título contiene el nombre viejo del color
    if (autoUpdateTitleColor && oldColorName && title.toLowerCase().includes(oldColorName.toLowerCase())) {
      const regex = new RegExp(oldColorName, 'gi');
      setTitle(title.replace(regex, fil.name));
    } else if (autoUpdateTitleColor && title.includes(' - ')) {
      const parts = title.split(' - ');
      setTitle(`${parts[0]} - ${fil.name}`);
    }
  };

  // Aplicar el nuevo tinte procesado en alta resolución a la foto del producto
  const handleApplyTintToProduct = async () => {
    setIsApplyingTint(true);
    try {
      const fullImg = await loadImage(baseSourceImage);
      const highResRecolor = await recolorImage(fullImg, {
        sourceColorHex: sourceColor,
        targetColorHex: colorHex,
        tolerance,
        feather,
        protectSkin,
        protectNeutrals,
        maskDataUrl,
      });

      setCurrentCoverImage(highResRecolor);
      setTintAppliedSuccess(true);
      setTimeout(() => setTintAppliedSuccess(false), 3000);
    } catch (err) {
      console.error('Error aplicando tinción en alta resolución:', err);
      alert('Hubo un error al procesar la imagen.');
    } finally {
      setIsApplyingTint(false);
    }
  };

  // Restaurar foto base original
  const handleRestoreBasePhoto = () => {
    setCurrentCoverImage(baseSourceImage);
    setTintAppliedSuccess(true);
    setTimeout(() => setTintAppliedSuccess(false), 3000);
  };

  // Guardar todos los cambios del producto
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedSale = salePrice.trim() !== '' ? Number(salePrice) : undefined;

    // Actualizar también la foto de portada en el array de imágenes
    const updatedImages = (item.images || []).map((img, idx) => {
      if (idx === 0 || img.type === 'cover') {
        return { ...img, url: currentCoverImage };
      }
      return img;
    });

    const updated: CatalogItem = {
      ...item,
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || 'General',
      price: Number(price) || 0,
      salePrice: parsedSale && !isNaN(parsedSale) && parsedSale > 0 ? parsedSale : undefined,
      sku: sku.trim(),
      dimensions: dimensions.trim(),
      inStock,
      colorName: colorName.trim(),
      colorHex: colorHex.trim(),
      coverImage: currentCoverImage,
      images: updatedImages.length ? updatedImages : [{ id: 'img-cover', label: '1. Portada', url: currentCoverImage, type: 'cover' }],
      sourceImage: baseSourceImage,
      sourceColorHex: sourceColor,
      tolerance,
      feather,
      protectSkin,
      protectNeutrals,
      maskDataUrl,
    };

    onSave(updated);
    onClose();
  };

  const presetCategories = CATEGORIES.filter((c) => c !== 'Todos');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Pestañas */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded-xl shadow-inner border border-white/20 shrink-0" 
              style={{ backgroundColor: colorHex }} 
            />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-md">
                {title || 'Editar Producto'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                SKU: {sku || item.sku} • {colorName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pestañas: Datos vs Color y Tinción */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Datos y Precios</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('color')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'color'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            <span>Color del Filamento & Tinción de Foto</span>
            <span 
              className="w-2.5 h-2.5 rounded-full border border-black/20 ml-1" 
              style={{ backgroundColor: colorHex }} 
            />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs flex flex-col justify-between">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre / Título del producto
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ej: DUMMY 13 - Amarillo Sol"
                />
              </div>

              {/* Categoría */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Categoría (product_type de Meta)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Para agrupar en WhatsApp/Facebook</span>
                </div>
                <input
                  type="text"
                  list="category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  placeholder="Ej: Dummys, Animales Articulados, Macetas..."
                />
                <datalist id="category-suggestions">
                  {presetCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Fila Precios: Regular y Oferta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                {/* Precio Normal */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Precio Regular ($ ARS)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Precio de Oferta */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Precio de Oferta ($ ARS)
                    </label>
                    <span className="text-[10px] text-slate-400">Opcional</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="Sin descuento"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Fila SKU y Dimensiones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SKU (Código único)
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dimensiones / Tamaño
                  </label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="Ej: 14.5 cm de alto"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción comercial
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Stock switch */}
              <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Producto en Stock disponible
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Si se desmarca, se mostrará como &quot;Agotado&quot; en WhatsApp y en la tienda.
                  </p>
                </div>
              </label>
            </div>
          )}

          {activeTab === 'color' && (
            <div className="space-y-5">
              {/* Sección 1: Selección y Modificación de Color del Filamento */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-indigo-500" />
                    Color de Filamento Asignado al Producto
                  </span>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="w-4 h-4 rounded-full border border-black/30 shadow-inner" 
                      style={{ backgroundColor: colorHex }} 
                    />
                    <span className="font-bold text-slate-900 dark:text-white">{colorName}</span>
                    <span className="font-mono text-slate-500 text-[10px]">({colorHex.toUpperCase()})</span>
                  </div>
                </div>

                {/* Grilla de filamentos estándar */}
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5 font-medium">
                    Cambiar a uno de los colores oficiales de tu catálogo:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    {FILAMENT_COLORS.map((fil) => {
                      const isSelected = fil.hex.toLowerCase() === colorHex.toLowerCase() || fil.name === colorName;
                      return (
                        <button
                          key={fil.id}
                          type="button"
                          onClick={() => handleSelectFilament(fil)}
                          className={`flex items-center space-x-1.5 p-1.5 rounded-lg border text-[11px] transition-all text-left ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold ring-1 ring-indigo-500'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: fil.hex }}
                          />
                          <span className="truncate">{fil.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Edición manual de nombre y hex + auto renombrado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Nombre personalizado del color
                    </label>
                    <input
                      type="text"
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Código HEX del filamento
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                      />
                      <input
                        type="text"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={autoUpdateTitleColor}
                    onChange={(e) => setAutoUpdateTitleColor(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span>Sincronizar automáticamente el título del producto al cambiar el color</span>
                </label>
              </div>

              {/* Sección 2: Calibración y Segmentación IA */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Segmentación con IA (Meta SAM) & Corrección de Tinción
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Hacé 1 clic sobre la pieza o componente que querés teñir para aislarla automáticamente protegiendo fondo y detalles.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Visor de Previsualización con AiSegmentMaskEditor */}
                  <div className="space-y-2 flex flex-col">
                    <AiSegmentMaskEditor
                      imageSrc={baseSourceImage}
                      previewSrc={previewDataUrl || currentCoverImage}
                      maskDataUrl={maskDataUrl}
                      onMaskChange={(newMask) => setMaskDataUrl(newMask)}
                      onPickColor={(hex) => setSourceColor(hex)}
                      isProcessing={isProcessingPreview}
                    />

                    {/* Botones de Aplicación */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleApplyTintToProduct}
                        disabled={isApplyingTint}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                      >
                        {isApplyingTint ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Procesando HD...</span>
                          </>
                        ) : tintAppliedSuccess ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            <span>¡Foto Aplicada!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Aplicar Tinción a la Foto</span>
                          </>
                        )}
                      </button>

                      {baseSourceImage && (
                        <button
                          type="button"
                          onClick={handleRestoreBasePhoto}
                          className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Restablecer foto original sin teñir"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Controles del Motor */}
                  <div className="space-y-3">
                    {/* Muestra de color base original */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Color Base Original Detectado:
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-black/20"
                            style={{ backgroundColor: sourceColor }}
                          />
                          <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {sourceColor.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (baseSourceImage) {
                                loadImage(baseSourceImage).then((img) => {
                                  const detected = detectDominantPlasticColor(img);
                                  setSourceColor(detected);
                                });
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Auto-detectar color real"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Usá el cuentagotas para tomar la muestra de la zona con mayor luz de la pieza.
                      </p>
                    </div>

                    {/* Tolerancia Angular */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Tolerancia de Cobertura
                        </label>
                        <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
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
                      <p className="text-[10px] text-slate-500">
                        Subila si los biseles o sombras quedan con el color anterior.
                      </p>
                    </div>

                    {/* Suavizado / Feather */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Suavizado de Bordes (Feather)
                        </label>
                        <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
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
                    </div>

                    {/* Blindajes */}
                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center space-x-2 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={protectNeutrals}
                          onChange={(e) => setProtectNeutrals(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-indigo-600"
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Blindar articulaciones negras y fondo
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={protectSkin}
                          onChange={(e) => setProtectSkin(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-indigo-600"
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                          <Hand className="w-3.5 h-3.5 text-amber-500" />
                          Blindar manos y piel humana
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer de Acciones */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios del Producto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
