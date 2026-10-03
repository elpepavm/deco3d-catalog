import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import config from "../firebase-applet-config.json";

// Inicializar Firebase en entorno serverless
const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
});

const db = getFirestore(app, config.firestoreDatabaseId);

export default async function handler(req: any, res: any) {
  try {
    const snap = await getDocs(collection(db, "catalog_items"));
    const items: any[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      // Solo enviamos a Meta los que estén publicados (o que no sean borradores)
      if (data.status !== 'draft') {
        items.push(data);
      }
    });

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
      const imageLink = item.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
      const additionalImageLink = item.handImage || '';

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

    // Añadimos BOM UTF-8 (\uFEFF) para compatibilidad absoluta con Meta Commerce
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.setHeader('Content-Disposition', 'inline; filename="catalog.csv"');
    return res.status(200).send(csvContent);
  } catch (err: any) {
    console.error('Error generating Meta CSV feed:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
