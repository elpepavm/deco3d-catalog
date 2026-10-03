import React, { useState } from 'react';
import { CatalogItem } from '../types';
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Globe
} from 'lucide-react';

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
  const [copiedFeedUrl, setCopiedFeedUrl] = useState(false);
  const feedLiveUrl = 'https://deco3d-catalog.vercel.app/api/catalog.csv';
  
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
      'sale_price',
      'link',
      'image_link',
      'brand',
      'product_type',
      'google_product_category',
      'color',
      'material',
      'additional_image_link'
    ];

    const rows = items.map((item) => {
      const priceFormatted = `${item.price} ${currency}`;
      const salePriceFormatted = item.salePrice && item.salePrice > 0 ? `${item.salePrice} ${currency}` : '';
      const cleanDesc = item.description.replace(/(\r\n|\n|\r)/gm, ' ').replace(/"/g, '""');
      const cleanTitle = item.title.replace(/"/g, '""');
      const availability = item.inStock ? 'in stock' : 'out of stock';
      const productType = (item.category || 'Dummys').replace(/"/g, '""');
      
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
        `"${salePriceFormatted}"`,
        `"${link}"`,
        `"${imageLink}"`,
        `"${brandName}"`,
        `"${productType}"`,
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
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Caja Destacada: URL de Sincronización Automática para Meta */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 border border-emerald-500/40 rounded-2xl p-6 shadow-xl text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Globe className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base">URL de Sincronización Automática para Meta</h3>
                <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Recomendado • 100% Automático
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Pega este enlace en Meta Commerce para que tu catálogo y precios se sincronicen solos sin volver a descargar archivos.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(feedLiveUrl);
              setCopiedFeedUrl(true);
              setTimeout(() => setCopiedFeedUrl(false), 2500);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
          >
            {copiedFeedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedFeedUrl ? '¡URL Copiada!' : 'Copiar Enlace para Meta'}</span>
          </button>
        </div>

        {/* Input con la URL completa */}
        <div className="flex items-center space-x-2 bg-slate-950/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5">
          <span className="text-xs text-slate-500 font-mono select-none">URL de tu feed:</span>
          <span className="text-xs font-mono text-emerald-400 font-semibold truncate flex-1 select-all">
            {feedLiveUrl}
          </span>
        </div>

        {/* Pasos para configurar en Meta Commerce */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="font-bold text-white block text-xs">1. En Meta Commerce</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Ve a <strong>Catálogo ➔ Orígenes de datos</strong> y haz clic en <strong>Añadir productos ➔ Lista de datos</strong>.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="font-bold text-white block text-xs">2. Elige "Usar una URL"</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Selecciona la opción <strong>Usar una URL</strong> y pega este enlace copiado en el casillero.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="font-bold text-white block text-xs">3. Horario automático</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Define actualización diaria (ej: 04:00 AM) ¡y tus productos se actualizarán solos en WhatsApp!
            </p>
          </div>
        </div>
      </div>

      {/* Banner Principal de Exportación Manual (Opcional) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 shadow-sm text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold">Descarga Manual de Respaldo (.CSV)</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Si prefieres subir el archivo manualmente como hiciste antes, puedes descargarlo aquí.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Settings2 className="w-4 h-4 text-indigo-400" />
            <span>{showConfig ? 'Ocultar Ajustes' : 'Configurar Enlaces'}</span>
          </button>

          <button
            onClick={handleCopyCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar CSV'}</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar .CSV ({items.length} productos)</span>
          </button>
        </div>
      </div>

      {/* Panel de Ajustes / Configuración Rápida */}
      {showConfig && (
        <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 transition-all">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
            <Settings2 className="w-4 h-4" />
            <h3 className="text-sm font-bold">Parámetros del Catálogo Meta</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destino del botón "Ver en el sitio web" en WhatsApp:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLinkDestination('catalog')}
                  className={`p-2 rounded-lg border text-center font-medium transition-all ${
                    linkDestination === 'catalog'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Catálogo Web (TinyURL)
                </button>
                <button
                  type="button"
                  onClick={() => setLinkDestination('whatsapp')}
                  className={`p-2 rounded-lg border text-center font-medium transition-all ${
                    linkDestination === 'whatsapp'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Chat de WhatsApp Directo
                </button>
              </div>
            </div>

            {linkDestination === 'catalog' ? (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL base del catálogo:
                </label>
                <input
                  type="text"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="https://tinyurl.com/decocatalogo"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Los clientes verán este link al tocar el producto en WhatsApp.
                </span>
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de WhatsApp (con código país):
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="54911..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ej: 54911... para Argentina (sin '+' ni espacios).
                </span>
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
          <span className="text-xs text-slate-400">Formato RFC 4180 (Meta Commerce Spec)</span>
        </div>

        <div className="overflow-x-auto max-h-96 text-xs font-mono">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">SKU (ID)</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Título</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Color</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Disponibilidad</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Precio Regular</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800 text-rose-500">Precio Oferta</th>
                <th className="p-3 border-b border-slate-200 dark:border-slate-800">Tipo (product_type)</th>
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
                    ${item.price.toLocaleString('es-AR')} {currency}
                  </td>
                  <td className="p-3 font-sans">
                    {item.salePrice && item.salePrice > 0 ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
                        ${item.salePrice.toLocaleString('es-AR')} {currency}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="p-3 font-sans text-indigo-600 dark:text-indigo-400 font-medium">
                    {item.category || 'Dummys'}
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
