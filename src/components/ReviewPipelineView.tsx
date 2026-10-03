import React, { useState } from 'react';
import { CatalogItem } from '../types';
import { EditProductModal } from './EditProductModal';
import { 
  CheckCircle2, 
  Trash2, 
  Pencil, 
  Search, 
  Layers, 
  Sparkles, 
  ShieldAlert, 
  CheckCheck,
  ArrowRight
} from 'lucide-react';

interface ReviewPipelineViewProps {
  draftItems: CatalogItem[];
  onApproveItem: (id: string) => void;
  onApproveAll: () => void;
  onDiscardItem: (id: string) => void;
  onDiscardAll: () => void;
  onUpdateDraftItem: (item: CatalogItem) => void;
  onGoToActiveCatalog: () => void;
}

export const ReviewPipelineView: React.FC<ReviewPipelineViewProps> = ({
  draftItems,
  onApproveItem,
  onApproveAll,
  onDiscardItem,
  onDiscardAll,
  onUpdateDraftItem,
  onGoToActiveCatalog,
}) => {
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  const filteredDrafts = draftItems.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.colorName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Encabezado del Paso 2 */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border border-amber-900/40 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              Paso 2 de 3
            </span>
            <h1 className="text-xl font-extrabold tracking-tight">
              En Revisión (Borradores Generados)
            </h1>
          </div>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Estos productos se generaron automáticamente pero <strong>AÚN NO se envían a Meta ni a WhatsApp</strong>. Revisa las fotos y datos antes de publicarlos.
          </p>
        </div>

        {/* Acciones Globales de Aprobación */}
        {draftItems.length > 0 && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onDiscardAll}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Descartar Todos</span>
            </button>

            <button
              onClick={onApproveAll}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-2"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Aprobar y Publicar Todo ({draftItems.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Contenido Principal */}
      {draftItems.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center bg-white/50 dark:bg-slate-900/50">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
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
          {/* Barra de Filtro y Buscador */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar borrador por nombre, color o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Mostrando {filteredDrafts.length} de {draftItems.length} borradores
            </span>
          </div>

          {/* Cuadrícula de Borradores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDrafts.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                {/* Imagen del Borrador */}
                <div>
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Chip de Color */}
                    <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg text-white text-[11px] font-semibold">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/40"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      <span>{item.colorName}</span>
                    </div>

                    {/* Badge Borrador */}
                    <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Borrador
                    </span>
                  </div>

                  {/* Datos del Producto */}
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{item.sku}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-sans font-medium">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h3>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Precio</span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          ${item.price.toLocaleString('es-AR')}
                        </span>
                      </div>

                      {item.salePrice && item.salePrice > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] text-rose-500 font-bold block uppercase">Oferta</span>
                          <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                            ${item.salePrice.toLocaleString('es-AR')}
                          </span>
                        </div>
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
                      title="Editar título, precio o categoría"
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
            ))}
          </div>
        </div>
      )}

      {/* Modal de Edición si se solicita en un borrador */}
      <EditProductModal
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(updated) => {
          onUpdateDraftItem(updated);
          setEditingItem(null);
        }}
      />
    </div>
  );
};
