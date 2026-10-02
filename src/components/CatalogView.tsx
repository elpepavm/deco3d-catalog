import React, { useState } from 'react';
import { CatalogItem } from '../types';
import { CATEGORIES } from '../data/filaments';
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
  Hand,
  Image as ImageIcon
} from 'lucide-react';

interface CatalogViewProps {
  items: CatalogItem[];
  onToggleStock: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onOpenGenerator: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  items,
  onToggleStock,
  onDeleteItem,
  onOpenGenerator,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
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

  // Copiar mensaje formateado para WhatsApp
  const handleCopyWhatsApp = (item: CatalogItem) => {
    const formattedPrice = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(item.price);

    const totalPhotos = item.images?.length || (item.handImage ? 2 : 1);

    const message = `👋 ¡Hola! Te paso los detalles del producto:

📦 *${item.title.toUpperCase()}*
🎨 *Color:* ${item.colorName} (${item.material})
📏 *Medidas/Escala:* ${item.dimensions}
💰 *Precio:* ${formattedPrice}
📸 *Fotos disponibles:* ${totalPhotos} fotos (portada, escala en mano, detalles)
✅ *Disponibilidad:* ${item.inStock ? 'En stock para entrega inmediata' : 'Impresión bajo pedido (24-48 hs)'}

${item.description}

¿Te gustaría reservarlo o sumarle algún accesorio?`;

    navigator.clipboard.writeText(message);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getItemPhotos = (item: CatalogItem): { url: string; label: string; type?: string }[] => {
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

  return (
    <div className="space-y-6">
      {/* Banner explicativo del catálogo unitario */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-5 shadow-sm text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Lógica WhatsApp & Meta
              </span>
              <h2 className="text-lg font-bold">Catálogo de Productos Unitarios (Galerías de hasta 10 fotos)</h2>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Cada color está publicado como un <strong>producto independiente</strong> para evitar fallas de sincronización con el catálogo de WhatsApp. Podés subir y recolorear hasta 10 fotos por pieza (portada, en mano, ángulos y detalles).
            </p>
          </div>

          <button
            onClick={onOpenGenerator}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Multiplicar por Colores</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Input de Búsqueda */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, color o SKU..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Categorías */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filtro de Stock */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => setStockFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-md ${
              stockFilter === 'all'
                ? 'bg-slate-200 dark:bg-slate-700 font-bold text-slate-800 dark:text-white'
                : 'text-slate-500'
            }`}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setStockFilter('inStock')}
            className={`px-2.5 py-1 text-xs rounded-md ${
              stockFilter === 'inStock'
                ? 'bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-slate-500'
            }`}
          >
            En Stock
          </button>
          <button
            onClick={() => setStockFilter('outOfStock')}
            className={`px-2.5 py-1 text-xs rounded-md ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const itemPhotos = getItemPhotos(item);
            const activeIdx = (activePhotoIdxMap[item.id] || 0) % itemPhotos.length;
            const currentPhoto = itemPhotos[activeIdx] || itemPhotos[0];

            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* Contenedor de Imagen y Galería */}
                <div className="relative aspect-square bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
                  <img
                    src={currentPhoto.url}
                    alt={item.title}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Insignia de Color de Filamento */}
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/95 shadow-sm border border-slate-200/80 dark:border-slate-700 backdrop-blur-sm z-10">
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {item.colorName}
                    </span>
                  </div>

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
                    <span className="font-semibold truncate max-w-[140px]">
                      {currentPhoto.label}
                    </span>
                    {itemPhotos.length > 1 && (
                      <span className="text-slate-400 font-mono text-[10px] pl-1 border-l border-slate-700">
                        {activeIdx + 1}/{itemPhotos.length}
                      </span>
                    )}
                  </div>

                  {/* Indicador de Estado de Stock */}
                  <button
                    onClick={() => onToggleStock(item.id)}
                    className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-tight shadow-sm transition-colors z-10 ${
                      item.inStock
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-rose-500 text-white hover:bg-rose-600'
                    }`}
                    title="Clic para cambiar estado de stock"
                  >
                    {item.inStock ? 'En Stock' : 'Sin Filamento'}
                  </button>
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
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>SKU: {item.sku}</span>
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
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Precio</span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                          maximumFractionDigits: 0,
                        }).format(item.price)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Botón Copiar para WhatsApp */}
                      <button
                        onClick={() => handleCopyWhatsApp(item)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                          copiedId === item.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        }`}
                        title="Copiar texto para enviar al cliente por WhatsApp"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </>
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
    </div>
  );
};
