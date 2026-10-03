import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  getDocFromServer,
  getDocs,
  writeBatch,
  deleteField
} from 'firebase/firestore';
import { CatalogItem, BaseProduct } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Conectar con Firestore usando el Database ID asignado
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Validar conexión según especificaciones de la plataforma
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('✅ Conexión con Firestore exitosa.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase en modo offline.');
    }
    return false;
  }
}

// Probar conexión en arranque
testFirestoreConnection();

const CATALOG_COLLECTION = 'catalog_items';
const BASE_PRODUCTS_COLLECTION = 'base_products';

/**
 * Escucha cambios en tiempo real del catálogo de productos
 */
export function subscribeToCatalog(
  onSuccess: (items: CatalogItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, CATALOG_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: CatalogItem[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as CatalogItem);
      });
      // Ordenar por fecha o título
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onSuccess(items);
    },
    (err) => {
      console.error('Error al sincronizar catálogo con Firestore:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Comprime un DataURL de imagen en el navegador si excede los 150KB para que nunca
 * sobrepase el límite estricto de 1MB por documento de Firestore.
 */
export async function optimizeImageForFirestore(dataUrl: string, maxDimension = 640, quality = 0.8): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  
  // Si ya es liviana (< 120KB de texto), no hace falta recomprimir
  if (dataUrl.length < 120000) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Usar jpeg para reducción extrema de tamaño
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Sanitiza un CatalogItem optimizando sus fotos para que el documento completo
 * siempre se mantenga muy por debajo del límite de 1,048,576 bytes de Firestore.
 */
export async function sanitizeItemForFirestore(item: CatalogItem): Promise<CatalogItem> {
  const optimized: CatalogItem = { ...item };

  if (optimized.coverImage) {
    optimized.coverImage = await optimizeImageForFirestore(optimized.coverImage);
  }
  if (optimized.handImage) {
    optimized.handImage = await optimizeImageForFirestore(optimized.handImage);
  }
  if (Array.isArray(optimized.images)) {
    optimized.images = await Promise.all(
      optimized.images.map(async (img) => ({
        ...img,
        url: await optimizeImageForFirestore(img.url)
      }))
    );
  }

  return optimized;
}

/**
 * Sanitiza un BaseProduct optimizando sus fotos para Firestore.
 */
export async function sanitizeBaseProductForFirestore(product: BaseProduct): Promise<BaseProduct> {
  const safe: BaseProduct = { ...product };
  if (Array.isArray(safe.images)) {
    safe.images = await Promise.all(
      safe.images.map(async (img) => ({
        ...img,
        url: await optimizeImageForFirestore(img.url)
      }))
    );
  }
  return safe;
}

/**
 * Elimina recursivamente cualquier propiedad con valor undefined antes de enviar a Firestore,
 * evitando que la base de datos rechace la operación con 'Unsupported field value: undefined'.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = cleanFirestoreData(value);
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map((item) =>
        item !== null && typeof item === 'object' ? cleanFirestoreData(item) : item
      );
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Guarda o actualiza un producto individual en Firestore de forma 100% segura.
 * Si el usuario borra la oferta, utiliza deleteField() para retirarla limpiamente en la nube.
 */
export async function saveCatalogItemToCloud(item: CatalogItem): Promise<void> {
  const safeItem = await sanitizeItemForFirestore(item);
  const docRef = doc(db, CATALOG_COLLECTION, safeItem.id);
  
  const cleaned = cleanFirestoreData(safeItem);
  
  // Si el precio de oferta existe y es > 0, lo guardamos.
  // Si fue removido o es indefinido, le indicamos a Firestore que elimine el campo para evitar errores.
  if (safeItem.salePrice !== undefined && safeItem.salePrice !== null && Number(safeItem.salePrice) > 0) {
    cleaned.salePrice = Number(safeItem.salePrice);
  } else {
    cleaned.salePrice = deleteField();
  }

  await setDoc(docRef, cleaned, { merge: true });
}

/**
 * Guarda un lote de productos generados en Firestore
 */
export async function saveCatalogBatchToCloud(items: CatalogItem[]): Promise<void> {
  const safeItems = await Promise.all(items.map(sanitizeItemForFirestore));
  const batchSize = 400;
  for (let i = 0; i < safeItems.length; i += batchSize) {
    const chunk = safeItems.slice(i, i + batchSize);
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      const ref = doc(db, CATALOG_COLLECTION, item.id);
      const cleaned = cleanFirestoreData(item);
      batch.set(ref, cleaned, { merge: true });
    });
    await batch.commit();
  }
}

/**
 * Actualiza el estado de stock en la nube
 */
export async function toggleStockInCloud(id: string, inStock: boolean): Promise<void> {
  const docRef = doc(db, CATALOG_COLLECTION, id);
  await updateDoc(docRef, { inStock });
}

/**
 * Elimina un producto de la nube
 */
export async function deleteCatalogItemFromCloud(id: string): Promise<void> {
  const docRef = doc(db, CATALOG_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Escucha cambios en los productos base
 */
export function subscribeToBaseProducts(
  onSuccess: (products: BaseProduct[]) => void
): () => void {
  const colRef = collection(db, BASE_PRODUCTS_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) return;
    const products: BaseProduct[] = [];
    snapshot.forEach((d) => products.push(d.data() as BaseProduct));
    onSuccess(products);
  });
}

/**
 * Guarda un producto base en la nube
 */
export async function saveBaseProductToCloud(product: BaseProduct): Promise<void> {
  const safeProduct = await sanitizeBaseProductForFirestore(product);
  const docRef = doc(db, BASE_PRODUCTS_COLLECTION, safeProduct.id);
  const cleaned = cleanFirestoreData(safeProduct);
  await setDoc(docRef, cleaned, { merge: true });
}
