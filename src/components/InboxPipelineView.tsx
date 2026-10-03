import React, { useState } from 'react';
import { InboxItem, FilamentColor, CatalogItem } from '../types';
import { FILAMENT_COLORS, CATEGORIES } from '../data/filaments';
import { recolorImage, loadImage, detectDominantPlasticColor } from '../utils/recolorEngine';
import { 
  Upload, 
  Trash2, 
  Sparkles, 
  Layers, 
  Check, 
  Plus, 
  Info,
  Palette,
  Loader2,
  Tag
} from 'lucide-react';

interface InboxPipelineViewProps {
  inboxItems: InboxItem[];
  onAddInboxItem: (item: InboxItem) => void;
  onRemoveInboxItem: (id: string) => void;
  onUpdateInboxItem: (item: InboxItem) => void;
  onGenerateToReview: (generatedItems: CatalogItem[], inboxItemId: string) => void;
  onOpenAdvancedStudio?: () => void;
}

export const InboxPipelineView: React.FC<InboxPipelineViewProps> = ({
  inboxItems,
  onAddInboxItem,
  onRemoveInboxItem,
  onUpdateInboxItem,
  onGenerateToReview,
}) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string>('');

  const presetCategories = CATEGORIES.filter((c) => c !== 'Todos');

  // Subir fotos en lote a la bandeja de entrada
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        // Nombre sugerido limpiando la extensión .jpg/.png
        const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const cleanTitle = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        const skuPrefix = rawName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'MOD');

        const newItem: InboxItem = {
          id: `inbox-${Date.now()}-${index}`,
          title: cleanTitle || 'Modelo 3D Sin Título',
          category: 'Animales Articulados',
          basePrice: 7500,
          skuPrefix: skuPrefix || 'PRD',
          sourceImage: dataUrl,
          selectedColorIds: [
            'f-amarillo',
            'f-negro',
            'f-verde-claro',
            'f-rosa',
            'f-grafito'
          ],
          dimensions: '14 cm x 8 cm',
          description: `Figura articulada impresa en 3D en PLA de alta calidad con excelente definición y movimiento suave.`,
          createdAt: new Date().toISOString(),
        };

        onAddInboxItem(newItem);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Toggle de un color específico en un item
  const handleToggleColor = (item: InboxItem, colorId: string) => {
    const exists = item.selectedColorIds.includes(colorId);
    const updatedIds = exists
      ? item.selectedColorIds.filter((id) => id !== colorId)
      : [...item.selectedColorIds, colorId];

    onUpdateInboxItem({
      ...item,
      selectedColorIds: updatedIds,
    });
  };

  // Seleccionar o deseleccionar todos los colores
  const handleSelectAllColors = (item: InboxItem, selectAll: boolean) => {
    onUpdateInboxItem({
      ...item,
      selectedColorIds: selectAll ? FILAMENT_COLORS.map((f) => f.id) : [],
    });
  };

  // Procesar lote y generar variantes a estado "En Revisión"
  const handleProcessItem = async (item: InboxItem) => {
    if (item.selectedColorIds.length === 0) {
      alert('Por favor selecciona al menos un color para generar.');
      return;
    }

    setIsProcessing(item.id);
    setProgressText('Analizando color base de la foto...');

    try {
      const img = await loadImage(item.sourceImage);
      const detectedColor = detectDominantPlasticColor(img);

      const generated: CatalogItem[] = [];

      for (let i = 0; i < item.selectedColorIds.length; i++) {
        const colorId = item.selectedColorIds[i];
        const filament = FILAMENT_COLORS.find((f) => f.id === colorId);
        if (!filament) continue;

        setProgressText(`Tiñendo color ${i + 1} de ${item.selectedColorIds.length}: ${filament.name}...`);

        const recoloredDataUrl = await recolorImage(img, {
          sourceColorHex: detectedColor,
          targetColorHex: filament.hex,
          tolerance: 45,
          feather: 15,
          protectSkin: true,
          protectNeutrals: true,
        });

        // Sufijo SKU a partir del nombre del color
        const colorCode = filament.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'COL');
        const sku = `${item.skuPrefix}-${colorCode}`;

        generated.push({
          id: `item-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          baseProductId: item.id,
          variantId: `var-${colorId}`,
          title: `${item.title} - ${filament.name}`,
          colorName: filament.name,
          colorHex: filament.hex,
          material: filament.material || 'PLA',
          category: item.category || 'General',
          price: item.basePrice || 0,
          sku: sku,
          inStock: true,
          description: `${item.description} Color: ${filament.name}.`,
          dimensions: item.dimensions || '14 cm',
          coverImage: recoloredDataUrl,
          images: [
            {
              id: `img-${Date.now()}-1`,
              label: '1. Portada (Estudio)',
              url: recoloredDataUrl,
              type: 'cover',
            },
          ],
          status: 'draft', // Va a revisión (NO a Meta ni a WhatsApp todavía)
          createdAt: new Date().toISOString(),
        });
      }

      onGenerateToReview(generated, item.id);
    } catch (err) {
      console.error('Error al generar variantes:', err);
      alert('Hubo un error al procesar las fotos. Por favor intenta nuevamente.');
    } finally {
      setIsProcessing(null);
      setProgressText('');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Encabezado del Paso 1 */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
              Paso 1 de 3
            </span>
            <h1 className="text-xl font-extrabold tracking-tight">
              Bandeja de Entrada (Nuevos Modelos)
            </h1>
          </div>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Sube las fotos originales de tus impresiones 3D. Define qué colores quieres imprimir y la app teñirá las fotos automáticamente para enviarlas a <strong>Revisión</strong> antes de publicarlas en WhatsApp.
          </p>
        </div>

        {/* Botón de Subida en Lote */}
        <label className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm cursor-pointer shadow-lg shadow-indigo-600/30 transition-all shrink-0">
          <Upload className="w-5 h-5" />
          <span>Subir Fotos de Modelos</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Lista de Modelos en Bandeja de Entrada */}
      {inboxItems.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center bg-white/50 dark:bg-slate-900/50">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-inner">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Tu bandeja de entrada está vacía
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Arrastra o selecciona las fotos de los modelos que imprimiste para multiplicarlos en todos los colores de filamento que desees.
          </p>
          <label className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer shadow-md transition-all">
            <Upload className="w-4 h-4" />
            <span>Seleccionar Fotos desde tu Computadora</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {inboxItems.length} {inboxItems.length === 1 ? 'modelo esperando variantes' : 'modelos esperando variantes'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {inboxItems.map((item) => {
              const currentlyProcessing = isProcessing === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col lg:flex-row gap-6 relative"
                >
                  {/* Foto Base del Modelo */}
                  <div className="w-full lg:w-56 shrink-0 flex flex-col">
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative">
                      <img
                        src={item.sourceImage}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        Foto Base
                      </span>
                    </div>

                    <button
                      onClick={() => onRemoveInboxItem(item.id)}
                      className="mt-3 w-full py-1.5 px-3 flex items-center justify-center space-x-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Descartar de la bandeja</span>
                    </button>
                  </div>

                  {/* Campos de Configuración */}
                  <div className="flex-1 space-y-4">
                    {/* Título y Categoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nombre del Modelo
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            onUpdateInboxItem({ ...item, title: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="Ej: Dragón Articulado"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Categoría (product_type de Meta)
                        </label>
                        <input
                          type="text"
                          list="inbox-categories"
                          value={item.category}
                          onChange={(e) =>
                            onUpdateInboxItem({ ...item, category: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <datalist id="inbox-categories">
                          {presetCategories.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Precio, Medidas y SKU */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Precio Base ($ ARS)
                        </label>
                        <input
                          type="number"
                          value={item.basePrice}
                          onChange={(e) =>
                            onUpdateInboxItem({
                              ...item,
                              basePrice: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Medidas / Escala
                        </label>
                        <input
                          type="text"
                          value={item.dimensions}
                          onChange={(e) =>
                            onUpdateInboxItem({ ...item, dimensions: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Prefijo SKU
                        </label>
                        <input
                          type="text"
                          value={item.skuPrefix}
                          onChange={(e) =>
                            onUpdateInboxItem({
                              ...item,
                              skuPrefix: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Selector de Colores (Tildar los deseados) */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Palette className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Colores a generar ({item.selectedColorIds.length} seleccionados):
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleSelectAllColors(item, true)}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                          >
                            Tildar Todos
                          </button>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <button
                            type="button"
                            onClick={() => handleSelectAllColors(item, false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            Deseleccionar
                          </button>
                        </div>
                      </div>

                      {/* Chips / Pills de Colores con Checkbox */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                        {FILAMENT_COLORS.map((c) => {
                          const isSelected = item.selectedColorIds.includes(c.id);

                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleToggleColor(item, c.id)}
                              className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border text-left transition-all ${
                                isSelected
                                  ? 'bg-white dark:bg-slate-800 border-indigo-500 text-slate-900 dark:text-white shadow-xs'
                                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                              }`}
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="truncate flex-1">{c.name}</span>
                              {isSelected && (
                                <Check className="w-3 h-3 text-indigo-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botón de Procesamiento */}
                    <div className="pt-2 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Se crearán como borradores en Revisión (aún no en WhatsApp).</span>
                      </div>

                      <button
                        type="button"
                        disabled={currentlyProcessing || item.selectedColorIds.length === 0}
                        onClick={() => handleProcessItem(item)}
                        className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                          currentlyProcessing
                            ? 'bg-amber-500 text-white cursor-wait animate-pulse'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                        }`}
                      >
                        {currentlyProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{progressText}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Generar {item.selectedColorIds.length} Variantes ➔ Revisión</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
