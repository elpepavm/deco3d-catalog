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
  writeBatch
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
 * Guarda o actualiza un producto individual en Firestore
 */
export async function saveCatalogItemToCloud(item: CatalogItem): Promise<void> {
  const docRef = doc(db, CATALOG_COLLECTION, item.id);
  await setDoc(docRef, item, { merge: true });
}

/**
 * Guarda un lote de productos generados en Firestore
 */
export async function saveCatalogBatchToCloud(items: CatalogItem[]): Promise<void> {
  // Firestore soporta hasta 500 operaciones por lote
  const batchSize = 400;
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      const ref = doc(db, CATALOG_COLLECTION, item.id);
      batch.set(ref, item, { merge: true });
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
  const docRef = doc(db, BASE_PRODUCTS_COLLECTION, product.id);
  await setDoc(docRef, product, { merge: true });
}
