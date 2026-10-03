import React, { useState, useEffect } from 'react';
import { CatalogItem } from '../types';
import { CATEGORIES } from '../data/filaments';
import { X, Save, Tag, DollarSign, Layers, AlignLeft, Info } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<string>('');
  const [sku, setSku] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [inStock, setInStock] = useState<boolean>(true);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setCategory(item.category || 'Dummys');
      setPrice(item.price || 0);
      setSalePrice(item.salePrice ? String(item.salePrice) : '');
      setSku(item.sku || '');
      setDimensions(item.dimensions || '');
      setInStock(item.inStock ?? true);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedSale = salePrice.trim() !== '' ? Number(salePrice) : undefined;

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
    };

    onSave(updated);
    onClose();
  };

  const presetCategories = CATEGORIES.filter((c) => c !== 'Todos');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Editar Producto
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                SKU: {item.sku}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Título */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre / Título del producto
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Ej: DUMMY 13 - Amarillo Sol"
            />
          </div>

          {/* Categoría (product_type de Meta) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Categoría (Tipo de producto)</span>
              </label>
              <span className="text-[11px] text-slate-400">Meta: product_type</span>
            </div>
            <input
              type="text"
              list="category-suggestions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Ej: Dummys, Animales Articulados, Macetas..."
            />
            <datalist id="category-suggestions">
              {presetCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Esta categoría se sincroniza con Meta para agrupar en WhatsApp/Facebook (ej: <em>Dummys</em>, <em>Animales</em>, <em>Macetas</em>).
            </p>
          </div>

          {/* Fila Precios: Regular y Oferta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
            {/* Precio Normal */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                <label className="font-semibold text-rose-600 dark:text-rose-400">
                  Precio Oferta ($ ARS)
                </label>
                {salePrice && (
                  <button
                    type="button"
                    onClick={() => setSalePrice('')}
                    className="text-[10px] text-slate-400 hover:text-rose-500 underline"
                  >
                    Quitar oferta
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Sin oferta"
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>
                {salePrice && Number(salePrice) > 0 ? (
                  <>Meta tachará el precio regular y mostrará <strong>${Number(salePrice).toLocaleString('es-AR')}</strong> con etiqueta de <strong>OFERTA</strong> en WhatsApp.</>
                ) : (
                  <>Deja vacío el precio de oferta si el producto se vende al precio regular.</>
                )}
              </span>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
              <AlignLeft className="w-4 h-4 text-slate-400" />
              <span>Descripción</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Describe el producto, articulaciones, material..."
            />
          </div>

          {/* Fila Medidas y SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Medidas / Escala
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Ej: 14.5 cm de alto"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SKU (Código único)
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="DUM13-AMA"
              />
            </div>
          </div>

          {/* Estado de Stock */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Disponibilidad de stock
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {inStock ? 'Listo para entrega inmediata (in stock)' : 'Sin stock de filamento (out of stock)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setInStock(!inStock)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                inStock
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
            >
              {inStock ? 'En Stock' : 'Sin Stock'}
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
