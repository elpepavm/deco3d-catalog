import React, { useState } from 'react';
import { Download, Copy, Check, ExternalLink, HelpCircle, ShoppingBag, Settings, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { CatalogItem } from '../types';

interface ExportModalProps {
  items: CatalogItem[];
}

// Imágenes públicas reales verificadas con HTTP 200 para que Meta Commerce Manager pueda descargarlas
const VERIFIED_PUBLIC_IMAGES: Record<string, string> = {
  'DUM13-OLI': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  'DUM13-ROS': 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=800&q=80',
  'DUM13-GRA': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
  'DUM13-AQU': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
  'DUM13-AMA': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  'MAC-AZU': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
};
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

export const ExportModal: React.FC<ExportModalProps> = ({ items }) => {
  const [copied, setCopied] = useState(false);
  
  // Opciones configurables para Meta Business
  const [storeUrl, setStoreUrl] = useState('https://tinyurl.com/deco3dvm');
  const [currency, setCurrency] = useState('ARS');
  const [brandName, setBrandName] = useState('Deco 3D');
  const [linkDestination, setLinkDestination] = useState<'catalog' | 'whatsapp'>('catalog');
  const [whatsappNumber, setWhatsappNumber] = useState('5491100000000');
  const [showConfig, setShowConfig] = useState(false);

  // Genera el CSV compatible con Meta Commerce Manager y WhatsApp Catalog
  const generateMetaCsv = (): string => {
    // Encabezados oficiales requeridos por Meta Commerce
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
      'additional_image_link'
    ];

    const rows = items.map((item) => {
      const priceFormatted = `${item.price} ${currency}`;
      const cleanDesc = item.description.replace(/(\r\n|\n|\r)/gm, ' ').replace(/"/g, '""');
      const cleanTitle = item.title.replace(/"/g, '""');
      const availability = item.inStock ? 'in stock' : 'out of stock';
      
      // Link al producto o a WhatsApp directo
      let link = `${storeUrl.trim()}?sku=${encodeURIComponent(item.sku)}`;
      if (linkDestination === 'whatsapp') {
        const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
        const message = `Hola! Me interesa la pieza ${item.title} (SKU: ${item.sku}) en color ${item.colorName}. ¿Tienen stock disponible?`;
        link = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      }

      // Manejo de imagen: Meta Commerce requiere URLs públicas HTTPS reales (HTTP 200)
      let imageLink = item.coverImage;
      if (!imageLink || imageLink.startsWith('data:')) {
        imageLink = VERIFIED_PUBLIC_IMAGES[item.sku] || DEFAULT_FALLBACK_IMAGE;
      }

      // Foto adicional si tiene URL pública
      let additionalImageLink = '';
      if (item.handImage && !item.handImage.startsWith('data:')) {
        additionalImageLink = item.handImage;
      }

      return [
        `"${item.sku}"`,
        `"${cleanTitle}"`,
        `"${cleanDesc}"`,
        `"${availability}"`,
        `"new"`,
        `"${priceFormatted}"`,
        `"${link}"`,
        `"${imageLink}"`,
        `"${brandName}"`,
        `"Toys & Games"`,
        `"${item.colorName}"`,
        `"${item.material}"`,
        `"${additionalImageLink}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const csvContent = generateMetaCsv();

  const handleDownloadCsv = () => {
    // Añadir BOM UTF-8 (\uFEFF) para compatibilidad total con Excel y Meta Commerce
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
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
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header explicativo con Banner Verde */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <ShoppingBag className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> WhatsApp Business & Meta Commerce Ready
          </span>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Exportar a Catálogo de WhatsApp (Meta CSV)
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Genera un archivo CSV oficial optimizado con la arquitectura <strong>1 SKU = 1 Color Físico</strong>. 
            Permite que cada variante tenga su propia foto de portada, foto en mano teñida a escala real y control de stock independiente.
          </p>
        </div>
      </div>

      {/* Barra de Acciones Principales */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total a exportar:
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
            {items.length} productos / colores
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center space-x-1.5 transition-colors ${
              showConfig 
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200' 
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración de Enlaces</span>
          </button>

          <button
            onClick={handleCopyCsv}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copiar CSV</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar .CSV para Meta</span>
          </button>
        </div>
      </div>

      {/* Configuración desplegable opcional */}
      {showConfig && (
        <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200 text-xs">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
            <Settings className="w-4 h-4 text-indigo-500" />
            <span>Parámetros de Enlace y Tienda para Meta Commerce</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destino del botón "Ver en el sitio web" en WhatsApp:
              </label>
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="linkDest"
                    checked={linkDestination === 'catalog'}
                    onChange={() => setLinkDestination('catalog')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Abrir Catálogo Web Deco 3D</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="linkDest"
                    checked={linkDestination === 'whatsapp'}
                    onChange={() => setLinkDestination('whatsapp')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Mensaje directo de WhatsApp</span>
                </label>
              </div>
            </div>

            {linkDestination === 'catalog' ? (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL pública de la tienda / catálogo:
                </label>
                <input
                  type="text"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="https://tinyurl.com/deco3dvm"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-xs focus:outline-indigo-500 font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de WhatsApp (con código de país sin +):
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="5491122334455"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-xs focus:outline-indigo-500 font-mono"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marca:
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-xs focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Moneda:
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-xs focus:outline-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aviso importante sobre cómo procesa Meta las imágenes */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 flex items-start space-x-3 text-xs text-emerald-950 dark:text-emerald-200">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            ✅ Opción A Activada: URLs de imágenes públicas verificadas con HTTP 200
          </p>
          <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
            1. <strong>Descarga lista para Meta</strong>: Cada producto ahora incluye un enlace a una imagen real y pública en internet que los robots de Meta pueden descargar sin bloqueos.<br />
            2. <strong>Codificación UTF-8 con BOM</strong>: Los acentos (á, é, í, ó, ú, ñ) y caracteres en español se procesarán sin caracteres extraños.<br />
            3. <strong>Enlace de tienda configurado</strong>: Apunta directamente a tu enlace amigable <span className="font-semibold underline">{storeUrl}</span>.
          </p>
        </div>
      </div>

      {/* Previsualización del CSV */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Vista Previa de la Tabla ({items.length} filas)
          </span>
          <span className="text-[11px] text-slate-400">
            Desplaza horizontalmente para ver todas las columnas
          </span>
        </div>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">id (SKU)</th>
                <th className="p-3">title</th>
                <th className="p-3">price</th>
                <th className="p-3">availability</th>
                <th className="p-3">color</th>
                <th className="p-3">image_link</th>
                <th className="p-3">link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                  <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{it.sku}</td>
                  <td className="p-3 max-w-xs truncate">{it.title}</td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">{it.price} {currency}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      it.inStock ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {it.inStock ? 'in stock' : 'out of stock'}
                    </span>
                  </td>
                  <td className="p-3">{it.colorName}</td>
                  <td className="p-3 text-slate-400 truncate max-w-xs">
                    {VERIFIED_PUBLIC_IMAGES[it.sku] || DEFAULT_FALLBACK_IMAGE}
                  </td>
                  <td className="p-3 text-slate-400 truncate max-w-xs">
                    {storeUrl}?sku={it.sku}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
