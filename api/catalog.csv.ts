import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Configuración pública de Firebase en línea para evitar errores de importación de módulos en Node/Vercel
const FIREBASE_CONFIG = {
  projectId: "gen-lang-client-0475125000",
  appId: "1:613963002295:web:d81540c3c445a72a583832",
  apiKey: "AIzaSyB9hFQGZmyOe7ShcYjrDE-GuCFhMN0KZPE",
  authDomain: "gen-lang-client-0475125000.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-deco3dcatlogoyva-0c2a54d4-ed24-442d-891f-f975a5382ec1",
};

// Inicializar Firebase
const app = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId);

// Imágenes públicas garantizadas por SKU para Meta Commerce
const VERIFIED_PUBLIC_IMAGES: Record<string, string> = {
  'DUM13-OLI': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  'DUM13-ROS': 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=800&q=80',
  'DUM13-GRA': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
  'DUM13-AQU': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
  'DUM13-AMA': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  'MAC-AZU': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
};
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

export default async function handler(req: any, res: any) {
  // Manejo de pre-flight CORS y HEAD requests de Meta
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  res.setHeader('Content-Disposition', 'inline; filename="catalog.csv"');

  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return res.status(200).end();
  }

  try {
    const snap = await getDocs(collection(db, "catalog_items"));
    let items: any[] = [];

    snap.forEach((doc) => {
      const data = doc.data();
      // Solo enviamos a Meta los que estén publicados (o sin estado de borrador)
      if (data.status !== 'draft') {
        items.push(data);
      }
    });

    // Si Firestore no devolviera items todavía, proveer fallback seguro
    if (items.length === 0) {
      items = [
        {
          sku: 'DUM13-AMA',
          title: 'DUMMY 13 - Amarillo Sol',
          description: 'Figura articulada Dummy 13 impresa en 3D en Amarillo Sol.',
          inStock: true,
          price: 8500,
          category: 'Dummys',
          colorName: 'Amarillo Sol',
          material: 'PLA',
          coverImage: VERIFIED_PUBLIC_IMAGES['DUM13-AMA']
        },
        {
          sku: 'DUM13-OLI',
          title: 'DUMMY 13 - Verde Oliva / Pistacho',
          description: 'Figura articulada Dummy 13 en Verde Oliva con articulaciones negras.',
          inStock: true,
          price: 8500,
          category: 'Dummys',
          colorName: 'Verde Oliva',
          material: 'PLA',
          coverImage: VERIFIED_PUBLIC_IMAGES['DUM13-OLI']
        }
      ];
    }

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

    const storeUrl = 'https://tinyurl.com/deco3dvm';
    const brandName = 'Deco 3D';
    const currency = 'ARS';

    const rows = items.map((item) => {
      const priceFormatted = `${item.price || 0} ${currency}`;
      const salePriceFormatted = item.salePrice && item.salePrice > 0 ? `${item.salePrice} ${currency}` : '';
      const cleanDesc = (item.description || '').replace(/(\r\n|\n|\r)/gm, ' ').replace(/"/g, '""');
      const cleanTitle = (item.title || '').replace(/"/g, '""');
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
        `"${link}"`,
        `"${imageLink}"`,
        `"${brandName}"`,
        `"${productType}"`,
        `"Toys & Games"`,
        `"${item.colorName || ''}"`,
        `"${item.material || 'PLA'}"`,
        `"${additionalImageLink}"`
      ].join(',');
    });

    // BOM UTF-8 (\uFEFF) para que Meta procese caracteres en español a la perfección
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    return res.status(200).send(csvContent);
  } catch (err: any) {
    console.error('Error generating Meta CSV feed:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
