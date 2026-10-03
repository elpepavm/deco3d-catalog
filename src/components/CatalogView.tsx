import React, { useState } from 'react';
import { CatalogItem } from '../types';
import { CATEGORIES } from '../data/filaments';
import { EditProductModal } from './EditProductModal';
import { BatchEditModal, BatchEditUpdates } from './BatchEditModal';
import { 
  Search, 
  Check, 
  Trash2, 
  Filter, 
  Plus, 
  Sparkles,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Flame,
  AlertTriangle,
  CheckSquare,
  Square,
  SlidersHorizontal,
  X,
  PackageCheck,
  PackageX
} from 'lucide-react';

interface CatalogViewProps {
  items: CatalogItem[];
  onToggleStock: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onUpdateItem: (updatedItem: CatalogItem) => void;
  onOpenGenerator: () => void;
  onBatchUpdate?: (ids: string[], updates: BatchEditUpdates) => void;
  onDeleteBatch?: (ids: string[]) => void;
  onBatchToggleStock?: (ids: string[], inStock: boolean) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  items,
  onToggleStock,
  onDeleteItem,
  onUpdateItem,
  onOpenGenerator,
  onBatchUpdate,
  onDeleteBatch,
  onBatchToggleStock,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  
  // Mapa de índice de foto activa por producto (para navegar por las hasta 10 fotos)
  const [activePhotoIdxMap, setActivePhotoIdxMap] = useState<Record<string, number>>({});

  // Filtrado de items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.colorName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'inStock' && item.inStock) ||
      (stockFilter === 'outOfStock' && !item.inStock);

    return matchesSearch && matchesCat && matchesStock;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  const handleBatchToggleStockClick = (targetStock: boolean) => {
    if (selectedIds.length === 0) return;
    if (onBatchToggleStock) {
      onBatchToggleStock(selectedIds, targetStock);
    } else {
      selectedIds.forEach((id) => {
        const item = items.find((i) => i.id === id);
        if (item && item.inStock !== targetStock) {
          onToggleStock(id);
        }
      });
    }
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`¿Estás seguro de eliminar permanentemente ${selectedIds.length} productos del catálogo?`)) {
      if (onDeleteBatch) {
        onDeleteBatch(selectedIds);
      } else {
        selectedIds.forEach((id) => onDeleteItem(id));
      }
      setSelectedIds([]);
    }
  };

  const handleApplyBatchUpdates = (updates: BatchEditUpdates) => {
    if (selectedIds.length === 0) return;
    if (onBatchUpdate) {
      onBatchUpdate(selectedIds, updates);
    } else {
      items
        .filter((item) => selectedIds.includes(item.id))
        .forEach((item) => {
          onUpdateItem({
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

  // Copiar plantilla de mensaje para WhatsApp
  const handleCopyWhatsApp = (item: CatalogItem) => {
    const priceText = item.salePrice && item.salePrice > 0 && item.salePrice < item.price
      ? `🔥 OFERTA: $${item.salePrice.toLocaleString('es-AR')} (Antes: $${item.price.toLocaleString('es-AR')})`
      : `$${item.price.toLocaleString('es-AR')}`;

    const text = `¡Hola! Te comparto los detalles de este modelo:\n\n*${item.title}*\n• Color: ${item.colorName} (${item.material || 'PLA'})\n• Medidas: ${item.dimensions}\n• Precio: ${priceText}\n• Stock: ${item.inStock ? 'Disponible para entrega inmediata' : 'A pedido / Sin stock'}\n• SKU: ${item.sku}\n\n${item.description}`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Obtener todas las fotos disponibles de un item
  const getItemPhotos = (item: CatalogItem) => {
    if (item.images && item.images.length > 0) {
      return item.images;
    }
    const list: { url: string; label: string; type?: string }[] = [
      { url: item.coverImage, label: '1. Portada (Estudio)', type: 'cover' },
    ];
    if (item.handImage) {
      list.push({ url: item.handImage, label: '2. En Mano (Escala)', type: 'hand' });
    }
    return list;
  };

  const nextPhoto = (itemId: string, max: number) => {
    setActivePhotoIdxMap((prev) => {
      const current = prev[itemId] || 0;
      return { ...prev, [itemId]: (current + 1) % max };
    });
  };

  const prevPhoto = (itemId: string, max: number) => {
    setActivePhotoIdxMap((prev) => {
      const current = prev[itemId] || 0;
      return { ...prev, [itemId]: (current - 1 + max) % max };
    });
  };

  const allFilteredSelected =
    filteredItems.length > 0 && selectedIds.length === filteredItems.length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header simplificado del catálogo */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-4 sm:p-5 shadow-sm text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Meta & WhatsApp
              </span>
              <h2 className="text-base sm:text-lg font-bold">Catálogo de Productos Unitarios</h2>
            </div>
            <p className="hidden sm:block text-xs sm:text-sm text-slate-300 max-w-2xl">
              Cada color está publicado como un <strong>producto independiente</strong> para sincronizar con el catálogo de WhatsApp.
            </p>
          </div>

          <button
            onClick={onOpenGenerator}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 sm:py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold rounded-xl shadow-md transition-all text-xs sm:text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Multiplicar por Colores</span>
          </button>
        </div>
      </div>

      {/* Barra Flotante de Acciones en Lote cuando hay selección en Catálogo */}
      {selectedIds.length > 0 && (
        <div className="sticky top-16 z-30 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-white text-indigo-700 flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </span>
            <span className="font-extrabold text-xs sm:text-sm">
              Productos seleccionados
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Editar en Lote</span>
            </button>

            <button
              onClick={() => handleBatchToggleStockClick(true)}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Marcar todos los seleccionados como En Stock"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>En Stock</span>
            </button>

            <button
              onClick={() => handleBatchToggleStockClick(false)}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Marcar todos los seleccionados como Sin Stock"
            >
              <PackageX className="w-3.5 h-3.5 text-rose-300" />
              <span>Sin Stock</span>
            </button>

            <button
              onClick={handleDeleteSelected}
              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all"
              title="Eliminar seleccionados"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 hover:bg-white/20 text-white rounded-xl transition-all"
              title="Cancelar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
        {/* Input de Búsqueda y Selección Rápida */}
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <button
            onClick={handleSelectAllFiltered}
            className="flex items-center space-x-1 px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shrink-0"
            title={allFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos los visibles'}
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span className="hidden sm:inline">{allFilteredSelected ? 'Ninguno' : 'Todos'}</span>
          </button>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, color o SKU..."
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Categorías */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filtro de Stock */}
        <div className="flex items-center space-x-1 shrink-0 self-start md:self-center">
          <button
            onClick={() => setStockFilter('all')}
            className={`px-2 py-1 text-xs rounded-md ${
              stockFilter === 'all'
                ? 'bg-slate-200 dark:bg-slate-700 font-bold text-slate-800 dark:text-white'
                : 'text-slate-500'
            }`}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setStockFilter('inStock')}
            className={`px-2 py-1 text-xs rounded-md ${
              stockFilter === 'inStock'
                ? 'bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-slate-500'
            }`}
          >
            En Stock
          </button>
          <button
            onClick={() => setStockFilter('outOfStock')}
            className={`px-2 py-1 text-xs rounded-md ${
              stockFilter === 'outOfStock'
                ? 'bg-rose-100 text-rose-800 font-bold dark:bg-rose-950/60 dark:text-rose-300'
                : 'text-slate-500'
            }`}
          >
            Agotados
          </button>
        </div>
      </div>

      {/* Cuadrícula de Productos */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <Sparkles className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
            No se encontraron productos
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Probá modificando los filtros de búsqueda o generá nuevas variantes por color con el multiplicador.
          </p>
          <button
            onClick={onOpenGenerator}
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevas Variantes</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredItems.map((item) => {
            const itemPhotos = getItemPhotos(item);
            const activeIdx = (activePhotoIdxMap[item.id] || 0) % itemPhotos.length;
            const currentPhoto = itemPhotos[activeIdx] || itemPhotos[0];
            const isSelected = selectedIds.includes(item.id);
            const hasSale = item.salePrice && item.salePrice > 0 && item.salePrice < item.price;
            const discountPercent = hasSale ? Math.round(((item.price - item.salePrice!) / item.price) * 100) : 0;

            return (
              <div
                key={item.id}
                className={`group bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Checkbox de Selección en lote */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(item.id);
                  }}
                  className="absolute top-2.5 right-2.5 z-20 cursor-pointer p-1.5 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-all"
                  title={isSelected ? 'Deseleccionar' : 'Seleccionar para edición en lote'}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-white/80" />
                  )}
                </div>

                {/* Contenedor de Imagen y Galería */}
                <div className="relative aspect-square bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
                  <img
                    src={currentPhoto.url}
                    alt={item.title}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Insignia de Color de Filamento */}
                  <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white shadow-sm border border-white/10 z-10">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <span className="text-xs font-semibold">
                      {item.colorName}
                    </span>
                  </div>

                  {/* Badge OFERTA de Alto Impacto */}
                  {hasSale && (
                    <div className="absolute top-10 left-2.5 z-10 flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[10px] shadow-lg shadow-rose-600/30 uppercase tracking-wider animate-pulse">
                      <Flame className="w-3 h-3 text-amber-200 fill-amber-200" />
                      <span>OFERTA -{discountPercent}%</span>
                    </div>
                  )}

                  {/* Badge SIN STOCK de Alto Impacto (Overlay visible a simple vista) */}
                  {!item.inStock && (
                    <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px] flex items-center justify-center z-15 pointer-events-none">
                      <div className="bg-rose-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-lg border border-rose-400/30 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Sin Stock</span>
                      </div>
                    </div>
                  )}

                  {/* Flechas de navegación si hay más de 1 foto */}
                  {itemPhotos.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevPhoto(item.id, itemPhotos.length);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-opacity opacity-0 group-hover:opacity-100 z-10"
                        title="Foto anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextPhoto(item.id, itemPhotos.length);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-opacity opacity-0 group-hover:opacity-100 z-10"
                        title="Foto siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Barra inferior de fotos (selector y contador de fotos) */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-slate-900/85 text-white backdrop-blur-md px-2 py-1 rounded-lg text-[11px] z-10 max-w-[90%]">
                    <span className="font-semibold truncate max-w-[130px]">
                      {currentPhoto.label}
                    </span>
                    {itemPhotos.length > 1 && (
                      <span className="text-slate-400 font-mono text-[10px] pl-1 border-l border-slate-700">
                        {activeIdx + 1}/{itemPhotos.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Miniaturas de la galería para acceso directo con 1 clic */}
                {itemPhotos.length > 1 && (
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto">
                    {itemPhotos.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIdxMap((prev) => ({ ...prev, [item.id]: idx }))}
                        className={`w-7 h-7 rounded-md overflow-hidden border shrink-0 transition-all ${
                          activeIdx === idx
                            ? 'ring-2 ring-rose-500 border-transparent scale-105'
                            : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                        title={p.label}
                      >
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Detalles del Producto */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono">{item.sku}</span>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="text-xs text-slate-600 dark:text-slate-400 pt-1 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Medidas: </span>
                        <span>{item.dimensions}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {itemPhotos.length} fotos
                      </span>
                    </div>
                  </div>

                  {/* Precio y Botones de Acción */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      {hasSale ? (
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs text-slate-400 line-through">
                              ${item.price.toLocaleString('es-AR')}
                            </span>
                            <span className="text-[9px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1 py-0.2 rounded uppercase">
                              Oferta
                            </span>
                          </div>
                          <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 block">
                            ${item.salePrice!.toLocaleString('es-AR')}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Precio</span>
                          <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                            ${item.price.toLocaleString('es-AR')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      {/* Toggle Stock rápido */}
                      <button
                        onClick={() => onToggleStock(item.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                          item.inStock
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                        title="Alternar estado de stock"
                      >
                        {item.inStock ? 'Stock ✓' : 'Agotado'}
                      </button>

                      {/* Botón Editar Producto */}
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                        title="Editar producto"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Botón Copiar para WhatsApp */}
                      <button
                        onClick={() => handleCopyWhatsApp(item)}
                        className={`p-1.5 rounded-lg transition-all ${
                          copiedId === item.id
                            ? 'bg-emerald-600 text-white'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title="Copiar texto para WhatsApp"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <MessageSquare className="w-4 h-4" />
                        )}
                      </button>

                      {/* Eliminar producto */}
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Eliminar este producto del catálogo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de edición individual */}
      <EditProductModal
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(updated) => {
          onUpdateItem(updated);
          setEditingItem(null);
        }}
      />

      {/* Modal de edición en lote */}
      <BatchEditModal
        isOpen={isBatchModalOpen}
        selectedCount={selectedIds.length}
        onClose={() => setIsBatchModalOpen(false)}
        onApply={handleApplyBatchUpdates}
      />
    </div>
  );
};
