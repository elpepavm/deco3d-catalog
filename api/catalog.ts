import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

// Imágenes públicas verificadas para Meta Commerce
const VERIFIED_PUBLIC_IMAGES: Record<string, string> = {
  'DUM13-OLI': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  'DUM13-ROS': 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=800&q=80',
  'DUM13-GRA': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
  'DUM13-AQU': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
  'DUM13-AMA': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  'MAC-AZU': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
};
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

// Generar rango de vigencia de oferta en formato oficial ISO 8601 de Meta
// Ejemplo: 2026-01-01T00:00:00-03:00/2026-12-31T23:59:59-03:00
function getSalePriceEffectiveDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  return `${year}-01-01T00:00:00-03:00/${year}-12-31T23:59:59-03:00`;
}

export default async function handler(req: any, res: any) {
  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    const db = getFirestore(app, config.firestoreDatabaseId);

    const snapshot = await getDocs(collection(db, 'catalog_items'));
    let items: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Solo productos activos o publicados
      if (data.status !== 'draft') {
        items.push(data);
      }
    });

    // Encabezados oficiales de Meta Commerce incluyendo sale_price_effective_date
    const headers = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'sale_price',
      'sale_price_effective_date',
      'link',
      'image_link',
      'brand',
      'product_type',
      'google_product_category',
      'color',
      'material',
      'additional_image_link'
    ];

    const storeUrl = 'https://tinyurl.com/deco3dvm';
    const currency = 'ARS';
    const brandName = 'Deco 3D';
    const effectiveDate = getSalePriceEffectiveDate();

    const rows = items.map((item) => {
      const priceFormatted = `${item.price} ${currency}`;
      const hasSale = item.salePrice && item.salePrice > 0 && item.salePrice < item.price;
      const salePriceFormatted = hasSale ? `${item.salePrice} ${currency}` : '';
      const saleDateFormatted = hasSale ? effectiveDate : '';

      const cleanDesc = (item.description || 'Figura articulada impresa en 3D en PLA.')
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .replace(/"/g, '""');
      const cleanTitle = (item.title || 'Producto 3D').replace(/"/g, '""');
      const availability = item.inStock !== false ? 'in stock' : 'out of stock';
      const productType = (item.category || 'Dummys').replace(/"/g, '""');

      const link = `${storeUrl}?sku=${encodeURIComponent(item.sku || item.id)}`;

      let imageLink = item.coverImage;
      if (!imageLink || imageLink.startsWith('data:')) {
        imageLink = VERIFIED_PUBLIC_IMAGES[item.sku] || DEFAULT_FALLBACK_IMAGE;
      }

      let additionalImageLink = '';
      if (item.handImage && !item.handImage.startsWith('data:')) {
        additionalImageLink = item.handImage;
      }

      return [
        `"${item.sku || item.id}"`,
        `"${cleanTitle}"`,
        `"${cleanDesc}"`,
        `"${availability}"`,
        `"new"`,
        `"${priceFormatted}"`,
        `"${salePriceFormatted}"`,
        `"${saleDateFormatted}"`,
        `"${link}"`,
        `"${imageLink}"`,
        `"${brandName}"`,
        `"${productType}"`,
        `"Toys & Games"`,
        `"${item.colorName || 'Multicolor'}"`,
        `"${item.material || 'PLA'}"`,
        `"${additionalImageLink}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=60');
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('Error generating live catalog feed:', error);
    // En caso de error inesperado, devolver error o fallback
    return res.status(500).json({ error: 'Error generating catalog feed', details: error.message });
  }
}
