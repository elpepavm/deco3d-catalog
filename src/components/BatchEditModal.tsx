import React, { useState } from 'react';
import { CATEGORIES } from '../data/filaments';
import { X, Check, DollarSign, Tag, Layers, Flame, AlertCircle } from 'lucide-react';

export interface BatchEditUpdates {
  price?: number;
  salePrice?: number | null; // null means remove salePrice
  category?: string;
  inStock?: boolean;
  dimensions?: string;
  description?: string;
}

interface BatchEditModalProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onApply: (updates: BatchEditUpdates) => void;
}

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  isOpen,
  selectedCount,
  onClose,
  onApply,
}) => {
  // Toggles para saber qué campos modificar
  const [updatePrice, setUpdatePrice] = useState(false);
  const [newPrice, setNewPrice] = useState<number>(8500);

  const [updateSalePrice, setUpdateSalePrice] = useState(false);
  const [salePriceMode, setSalePriceMode] = useState<'set' | 'remove'>('set');
  const [newSalePrice, setNewSalePrice] = useState<number>(6900);

  const [updateCategory, setUpdateCategory] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('Dummys');

  const [updateStock, setUpdateStock] = useState(false);
  const [newStock, setNewStock] = useState<boolean>(true);

  const [updateDimensions, setUpdateDimensions] = useState(false);
  const [newDimensions, setNewDimensions] = useState<string>('14.5 cm de alto');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updates: BatchEditUpdates = {};

    if (updatePrice && newPrice > 0) {
      updates.price = Number(newPrice);
    }

    if (updateSalePrice) {
      if (salePriceMode === 'remove') {
        updates.salePrice = null;
      } else if (newSalePrice > 0) {
        updates.salePrice = Number(newSalePrice);
      }
    }

    if (updateCategory && newCategory.trim()) {
      updates.category = newCategory.trim();
    }

    if (updateStock) {
      updates.inStock = newStock;
    }

    if (updateDimensions && newDimensions.trim()) {
      updates.dimensions = newDimensions.trim();
    }

    onApply(updates);
    onClose();
  };

  const presetCategories = CATEGORIES.filter((c) => c !== 'Todos');
  const hasChanges = updatePrice || updateSalePrice || updateCategory || updateStock || updateDimensions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Edición en Lote (Batch Edit)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modificando <span className="font-bold text-amber-600 dark:text-amber-400">{selectedCount}</span> productos a la vez
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Marca solo las casillas de los campos que quieras cambiar. Los campos sin marcar conservarán sus valores originales intactos.
            </span>
          </div>

          {/* 1. Precio Base */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
            <label className="flex items-center space-x-2.5 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={updatePrice}
                onChange={(e) => setUpdatePrice(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Actualizar Precio Base
              </span>
            </label>

            {updatePrice && (
              <div className="pl-6 pt-1">
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    placeholder="8500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Precio de Oferta */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
            <label className="flex items-center space-x-2.5 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={updateSalePrice}
                onChange={(e) => setUpdateSalePrice(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                Actualizar Precio de Oferta (Promoción)
              </span>
            </label>

            {updateSalePrice && (
              <div className="pl-6 pt-1 space-y-2">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="saleMode"
                      checked={salePriceMode === 'set'}
                      onChange={() => setSalePriceMode('set')}
                      className="text-rose-600"
                    />
                    <span>Fijar precio de oferta</span>
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="saleMode"
                      checked={salePriceMode === 'remove'}
                      onChange={() => setSalePriceMode('remove')}
                      className="text-rose-600"
                    />
                    <span>Eliminar oferta (dejar precio base)</span>
                  </label>
                </div>

                {salePriceMode === 'set' && (
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={newSalePrice}
                      onChange={(e) => setNewSalePrice(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold"
                      placeholder="6900"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Categoría */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
            <label className="flex items-center space-x-2.5 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={updateCategory}
                onChange={(e) => setUpdateCategory(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-indigo-500" />
                Actualizar Categoría
              </span>
            </label>

            {updateCategory && (
              <div className="pl-6 pt-1 space-y-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="Ej: Dummys, Articulados, Macetas..."
                />
                <div className="flex flex-wrap gap-1.5">
                  {presetCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                        newCategory === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Estado de Stock */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
            <label className="flex items-center space-x-2.5 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={updateStock}
                onChange={(e) => setUpdateStock(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Actualizar Estado de Stock</span>
            </label>

            {updateStock && (
              <div className="pl-6 pt-1 flex items-center space-x-4">
                <label className="flex items-center space-x-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="stockMode"
                    checked={newStock}
                    onChange={() => setNewStock(true)}
                    className="text-emerald-600"
                  />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">En Stock (Disponible)</span>
                </label>
                <label className="flex items-center space-x-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="stockMode"
                    checked={!newStock}
                    onChange={() => setNewStock(false)}
                    className="text-rose-600"
                  />
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">Sin Stock (Agotado)</span>
                </label>
              </div>
            )}
          </div>

          {/* 5. Medidas / Dimensiones */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
            <label className="flex items-center space-x-2.5 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={updateDimensions}
                onChange={(e) => setUpdateDimensions(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Actualizar Dimensiones / Medidas</span>
            </label>

            {updateDimensions && (
              <div className="pl-6 pt-1">
                <input
                  type="text"
                  value={newDimensions}
                  onChange={(e) => setNewDimensions(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="Ej: 14.5 cm de alto, articulado"
                />
              </div>
            )}
          </div>
        </form>

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
            onClick={handleSubmit}
            disabled={!hasChanges}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
              hasChanges
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-amber-600/20'
                : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Aplicar a los {selectedCount} seleccionados</span>
          </button>
        </div>
      </div>
    </div>
  );
};
