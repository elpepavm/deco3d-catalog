import React, { useState } from 'react';
import { CatalogItem } from '../types';
import { EditProductModal } from './EditProductModal';
import { BatchEditModal, BatchEditUpdates } from './BatchEditModal';
import { 
  CheckCircle2, 
  Trash2, 
  Pencil, 
  Search, 
  Layers, 
  CheckCheck,
  ArrowRight,
  Flame,
  AlertTriangle,
  CheckSquare,
  Square,
  SlidersHorizontal,
  X,
  LayoutGrid,
  Grid2X2
} from 'lucide-react';

interface ReviewPipelineViewProps {
  draftItems: CatalogItem[];
  onApproveItem: (id: string) => void;
  onApproveAll: () => void;
  onApproveBatch?: (ids: string[]) => void;
  onDiscardItem: (id: string) => void;
  onDiscardAll: () => void;
  onDiscardBatch?: (ids: string[]) => void;
  onUpdateDraftItem: (item: CatalogItem) => void;
  onBatchUpdateDrafts?: (ids: string[], updates: BatchEditUpdates) => void;
  onGoToActiveCatalog: () => void;
}

export const ReviewPipelineView: React.FC<ReviewPipelineViewProps> = ({
  draftItems,
  onApproveItem,
  onApproveAll,
  onApproveBatch,
  onDiscardItem,
  onDiscardAll,
  onDiscardBatch,
  onUpdateDraftItem,
  onBatchUpdateDrafts,
  onGoToActiveCatalog,
}) => {
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Modo de vista: 'detailed' (tarjetas grandes) o 'compact' (2 cols en celular)
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>(() => {
    try {
      return (localStorage.getItem('deco3d_review_view_mode') as 'detailed' | 'compact') || 'detailed';
    } catch {
      return 'detailed';
    }
  });

  const handleSetViewMode = (mode: 'detailed' | 'compact') => {
    setViewMode(mode);
    try {
      localStorage.setItem('deco3d_review_view_mode', mode);
    } catch {}
  };

  const filteredDrafts = draftItems.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.colorName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.length === filteredDrafts.length && filteredDrafts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDrafts.map((d) => d.id));
    }
  };

  const handleApproveSelected = () => {
    if (selectedIds.length === 0) return;
    if (onApproveBatch) {
      onApproveBatch(selectedIds);
    } else {
      selectedIds.forEach((id) => onApproveItem(id));
    }
    setSelectedIds([]);
  };

  const handleDiscardSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`¿Estás seguro de descartar los ${selectedIds.length} borradores seleccionados?`)) {
      if (onDiscardBatch) {
        onDiscardBatch(selectedIds);
      } else {
        selectedIds.forEach((id) => onDiscardItem(id));
      }
      setSelectedIds([]);
    }
  };

  const handleApplyBatchUpdates = (updates: BatchEditUpdates) => {
    if (selectedIds.length === 0) return;
    if (onBatchUpdateDrafts) {
      onBatchUpdateDrafts(selectedIds, updates);
    } else {
      draftItems
        .filter((d) => selectedIds.includes(d.id))
        .forEach((item) => {
          onUpdateDraftItem({
            ...item,
            price: updates.price !== undefined ? updates.price : item.price,
            salePrice:
              updates.salePrice === null
                ? undefined
                : updates.salePrice !== undefined
                ? updates.salePrice
                : item.salePrice,
            category: updates.category !== undefined ? updates.category : item.category,
            inStock: updates.inStock !== undefined ? updates.inStock : item.inStock,
            dimensions: updates.dimensions !== undefined ? updates.dimensions : item.dimensions,
          });
        });
    }
    setSelectedIds([]);
  };

  const allFilteredSelected =
    filteredDrafts.length > 0 && selectedIds.length === filteredDrafts.length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* Encabezado del Paso 2 */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border border-amber-900/40 rounded-2xl p-4 sm:p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              Paso 2 de 3
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
              En Revisión (Borradores Generados)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Revisa precios, fotos y colores antes de publicarlos en el catálogo activo de WhatsApp.
          </p>
        </div>

        {/* Acciones Globales de Aprobación */}
        {draftItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onDiscardAll}
              className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Descartar Todo</span>
            </button>

            <button
              onClick={onApproveAll}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Aprobar Todo ({draftItems.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Barra Flotante de Acciones en Lote cuando hay selección */}
      {selectedIds.length > 0 && (
        <div className="sticky top-16 z-20 bg-amber-500 dark:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </span>
            <span className="font-extrabold text-xs sm:text-sm">
              Borradores seleccionados
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Editar en Lote</span>
            </button>

            <button
              onClick={handleApproveSelected}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprobar ({selectedIds.length})</span>
            </button>

            <button
              onClick={handleDiscardSelected}
              className="p-1.5 bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 rounded-xl text-xs font-bold transition-all"
              title="Descartar seleccionados"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 hover:bg-slate-950/20 text-slate-950 rounded-xl transition-all"
              title="Cancelar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      {draftItems.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center bg-white/50 dark:bg-slate-900/50">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No tienes borradores pendientes de revisión
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Todos tus productos ya fueron aprobados y están en el Catálogo Activo, o bien puedes subir nuevos modelos a la Bandeja de Entrada.
          </p>
          <button
            onClick={onGoToActiveCatalog}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <span>Ver Catálogo Activo en WhatsApp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Barra de Filtro, Buscador y Selector de Vista */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3 flex-1">
              <button
                onClick={handleSelectAllFiltered}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                title={allFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos los visibles'}
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-amber-500" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>{allFilteredSelected ? 'Deseleccionar' : 'Seleccionar todos'}</span>
              </button>

              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, color o SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {filteredDrafts.length} borradores
              </span>

              {/* Selector de Modo de Vista */}
              <div className="flex items-center space-x-0.5 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('detailed')}
                  className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                    viewMode === 'detailed'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  title="Vista Detallada"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline text-[11px]">Detallada</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetViewMode('compact')}
                  className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                    viewMode === 'compact'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  title="Vista Compacta (2 columnas en celular)"
                >
                  <Grid2X2 className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline text-[11px]">Compacta</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cuadrícula de Borradores */}
          {viewMode === 'compact' ? (
            /* MODO COMPACTO: 2 columnas en móvil */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
              {filteredDrafts.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const hasSale = item.salePrice && item.salePrice > 0 && item.salePrice < item.price;
                const discountPercent = hasSale ? Math.round(((item.price - item.salePrice!) / item.price) * 100) : 0;

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between transition-all group relative ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/50 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800'
                    }`}
                  >
                    {/* Checkbox de Selección */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(item.id);
                      }}
                      className="absolute top-1.5 right-1.5 z-20 cursor-pointer p-1 rounded-md bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-all"
                      title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-white/80" />
                      )}
                    </div>

                    {/* Imagen del Borrador */}
                    <div className="aspect-square bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Dot de Color */}
                      <div className="absolute top-1.5 left-1.5 flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-semibold z-10">
                        <span
                          className="w-2 h-2 rounded-full border border-white/40 shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span className="truncate max-w-[65px]">{item.colorName}</span>
                      </div>

                      {/* Badge OFERTA compacto */}
                      {hasSale && (
                        <div className="absolute top-7 left-1.5 z-10 px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
                          -{discountPercent}%
                        </div>
                      )}
                    </div>

                    {/* Info Compacta */}
                    <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="truncate max-w-[60px]">{item.sku}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-sans font-medium truncate max-w-[65px]">
                            {item.category}
                          </span>
                        </div>

                        <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate pt-0.5" title={item.title}>
                          {item.title}
                        </h3>
                      </div>

                      {/* Precios y Botones */}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          {hasSale ? (
                            <div className="flex items-baseline space-x-1">
                              <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                                ${item.salePrice!.toLocaleString('es-AR')}
                              </span>
                              <span className="text-[10px] text-slate-400 line-through">
                                ${item.price.toLocaleString('es-AR')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                              ${item.price.toLocaleString('es-AR')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => onApproveItem(item.id)}
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
                            title="Aprobar borrador"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* MODO DETALLADO: 4 columnas con fotos grandes */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDrafts.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const hasSale = item.salePrice && item.salePrice > 0 && item.salePrice < item.price;
                const discountPercent = hasSale ? Math.round(((item.price - item.salePrice!) / item.price) * 100) : 0;

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all group relative ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/50 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800'
                    }`}
                  >
                    {/* Checkbox de Selección en la tarjeta */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(item.id);
                      }}
                      className="absolute top-2.5 right-2.5 z-20 cursor-pointer p-1.5 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-all"
                      title={isSelected ? 'Deseleccionar' : 'Seleccionar para edición en lote'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-white/80" />
                      )}
                    </div>

                    {/* Imagen del Borrador */}
                    <div>
                      <div className="aspect-square bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Chip de Color */}
                        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold shadow-sm z-10">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/40"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span>{item.colorName}</span>
                        </div>

                        {/* Badge OFERTA de Alto Impacto */}
                        {hasSale && (
                          <div className="absolute top-10 left-2.5 z-10 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[10px] shadow-md uppercase tracking-wider animate-pulse">
                            <Flame className="w-3 h-3 text-amber-200 fill-amber-200" />
                            <span>OFERTA -{discountPercent}%</span>
                          </div>
                        )}

                        {/* Badge SIN STOCK de Alto Impacto */}
                        {!item.inStock && (
                          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px] flex items-center justify-center z-15">
                            <div className="bg-rose-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg border border-rose-400/30 flex items-center gap-1.5 uppercase tracking-wider">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Sin Stock</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Datos del Producto */}
                      <div className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>{item.sku}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-sans font-semibold">
                            {item.category}
                          </span>
                        </div>

                        <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h3>

                        {/* Precios con alto contraste */}
                        <div className="flex items-baseline justify-between pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-medium">Precio</span>
                            {hasSale ? (
                              <div className="flex items-baseline space-x-1.5">
                                <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
                                  ${item.salePrice!.toLocaleString('es-AR')}
                                </span>
                                <span className="text-xs line-through text-slate-400">
                                  ${item.price.toLocaleString('es-AR')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                                ${item.price.toLocaleString('es-AR')}
                              </span>
                            )}
                          </div>

                          {item.dimensions && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              {item.dimensions}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción de la Tarjeta */}
                    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          title="Editar individualmente"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDiscardItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Descartar este borrador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => onApproveItem(item.id)}
                        className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprobar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Edición Individual */}
      <EditProductModal
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(updated) => {
          onUpdateDraftItem(updated);
          setEditingItem(null);
        }}
      />

      {/* Modal de Edición en Lote */}
      <BatchEditModal
        isOpen={isBatchModalOpen}
        selectedCount={selectedIds.length}
        onClose={() => setIsBatchModalOpen(false)}
        onApply={handleApplyBatchUpdates}
      />
    </div>
  );
};
