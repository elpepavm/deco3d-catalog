import React, { useState } from 'react';
import { CatalogItem } from '../types';
import { FileSpreadsheet, Download, Copy, Check, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExportModalProps {
  items: CatalogItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ items }) => {
  const [copied, setCopied] = useState(false);

  // Genera el CSV compatible con Meta Commerce Manager y WhatsApp Catalog
  const generateMetaCsv = (): string => {
    // Encabezados requeridos por Meta Commerce
    const headers = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'brand',
      'google_product_category',
      'color',
      'material',
    ];

    const rows = items.map((item) => {
      const priceFormatted = `${item.price} ARS`;
      const cleanDesc = item.description.replace(/(\r\n|\n|\r)/gm, ' ').replace(/"/g, '""');
      const cleanTitle = item.title.replace(/"/g, '""');
      const availability = item.inStock ? 'in stock' : 'out of stock';
      // URL ficticia o real del producto en la tienda
      const link = `https://deco3d.shop/p/${item.sku.toLowerCase()}`;
      // Nota: en producción Meta requiere URLs públicas HTTP/HTTPS de las imágenes
      const imageLink = item.coverImage.startsWith('data:')
        ? `https://deco3d.shop/images/${item.sku.toLowerCase()}-cover.png`
        : item.coverImage;

      return [
        `"${item.sku}"`,
        `"${cleanTitle}"`,
        `"${cleanDesc}"`,
        `"${availability}"`,
        `"new"`,
        `"${priceFormatted}"`,
        `"${link}"`,
        `"${imageLink}"`,
        `"Deco3D"`,
        `"Toys & Games"`,
        `"${item.colorName}"`,
        `"${item.material}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const csvContent = generateMetaCsv();

  const handleDownloadCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `catalogo-whatsapp-meta-deco3d-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 shadow-sm text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold">Exportador para Meta Business & WhatsApp Catalog</h2>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Genera un archivo <strong>CSV estructurado como productos unitarios independientes</strong>. Esto garantiza 100% de compatibilidad y aprobación inmediata en WhatsApp sin los problemas de menú desplegable.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar CSV'}</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Descargar .CSV ({items.length} productos)</span>
          </button>
        </div>
      </div>

      {/* Explicación Técnica y Beneficios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Cero Errores de Sincronización
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Al no incluir <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">item_group_id</code>, WhatsApp trata a cada color como un producto real. No se ocultan publicaciones ni se rompen menús.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-600">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Control de Stock por Filamento
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Si te quedás sin filamento Amarillo, solo cambiás el estado de ese producto específico a <span className="font-semibold text-rose-500">out of stock</span> sin afectar a los demás colores.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-amber-600">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Fotos en Mano Sincronizadas
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cada producto cuenta con su foto de portada y su foto en la mano teñidas al color correspondiente, brindando escala real e inmediata al cliente.
          </p>
        </div>
      </div>

      {/* Previsualización del CSV */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Vista Previa de la Tabla ({items.length} filas)
          </span>
          <span className="text-xs text-slate-400">Formato RFC 4180</span>
        </div>

        <div className="overflow-x-auto max-h-96 text-xs font-mono">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">SKU</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Título</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Color</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Disponibilidad</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Precio</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Categoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{item.sku}</td>
                  <td className="p-3 font-sans max-w-xs truncate">{item.title}</td>
                  <td className="p-3 flex items-center space-x-1.5 font-sans">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <span>{item.colorName}</span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.inStock
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {item.inStock ? 'in stock' : 'out of stock'}
                    </span>
                  </td>
                  <td className="p-3 font-sans font-bold">
                    ${item.price.toLocaleString('es-AR')}
                  </td>
                  <td className="p-3 font-sans text-slate-500">{item.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
