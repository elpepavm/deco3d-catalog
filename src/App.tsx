import React, { useState, useEffect } from 'react';
import { BaseProduct, CatalogItem } from './types';
import { getInitialBaseProducts, getInitialCatalogItems } from './data/initialCatalog';
import { Navbar } from './components/Navbar';
import { CatalogView } from './components/CatalogView';
import { VariantMultiplier } from './components/VariantMultiplierModal';
import { ColorStudioPlayground } from './components/ColorStudioPlayground';
import { ExportModal } from './components/ExportModal';
import { 
  subscribeToCatalog, 
  saveCatalogBatchToCloud, 
  toggleStockInCloud, 
  deleteCatalogItemFromCloud,
  subscribeToBaseProducts,
  saveBaseProductToCloud
} from './utils/firebase';
import { CloudCheck, CloudUpload } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'generator' | 'studio' | 'export'>('catalog');
  const [baseProducts, setBaseProducts] = useState<BaseProduct[]>(getInitialBaseProducts);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(getInitialCatalogItems);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sincronización en tiempo real con Firebase Firestore
  useEffect(() => {
    let isInitialLoad = true;

    const unsubscribe = subscribeToCatalog((cloudItems) => {
      if (cloudItems.length > 0) {
        setCatalogItems(cloudItems);
        setIsCloudSynced(true);
      } else if (isInitialLoad) {
        // Si la base de datos en la nube está vacía, sembramos los productos iniciales
        const initial = getInitialCatalogItems();
        saveCatalogBatchToCloud(initial).then(() => {
          setIsCloudSynced(true);
        });
      }
      isInitialLoad = false;
    });

    const unsubBase = subscribeToBaseProducts((cloudBase) => {
      if (cloudBase.length > 0) {
        setBaseProducts(cloudBase);
      }
    });

    return () => {
      unsubscribe();
      unsubBase();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleStock = async (id: string) => {
    const item = catalogItems.find((i) => i.id === id);
    const newStock = item ? !item.inStock : false;

    // Actualización optimista local
    setCatalogItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, inStock: newStock } : i))
    );

    // Guardado en la nube
    try {
      await toggleStockInCloud(id, newStock);
    } catch (err) {
      console.error('Error al actualizar stock en la nube:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    // Actualización optimista local
    setCatalogItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Producto eliminado del catálogo.');

    // Eliminación en la nube
    try {
      await deleteCatalogItemFromCloud(id);
    } catch (err) {
      console.error('Error al borrar de Firestore:', err);
    }
  };

  const handleUpdateItem = async (updatedItem: CatalogItem) => {
    // Actualización inmediata local
    setCatalogItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    showToast(`✅ "${updatedItem.title}" actualizado con éxito.`);

    // Guardado en Firestore
    try {
      await saveCatalogItemToCloud(updatedItem);
    } catch (err) {
      console.error('Error al actualizar en Firestore:', err);
      showToast('⚠️ Guardado localmente. Error al sincronizar con Firestore.');
    }
  };

  const handleAddProductsToCatalog = async (newItems: CatalogItem[]) => {
    setIsSyncing(true);
    // Actualización inmediata local
    setCatalogItems((prev) => [...newItems, ...prev]);
    showToast(`¡Se crearon con éxito ${newItems.length} publicaciones unitarias con sus fotos!`);
    setActiveTab('catalog');

    // Sincronizar lote en Firestore
    try {
      await saveCatalogBatchToCloud(newItems);
      setIsCloudSynced(true);
      showToast(`☁️ ${newItems.length} productos guardados en la nube permanentemente.`);
    } catch (err) {
      console.error('Error al guardar en la nube:', err);
      showToast('⚠️ Guardado localmente. Se sincronizará al reconectar.');
    } finally {
      setIsSyncing(false);
    }
  };

  const inStockCount = catalogItems.filter((i) => i.inStock).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Barra de Navegación Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalProducts={catalogItems.length}
        inStockCount={inStockCount}
      />

      {/* Indicador sutil de Nube Firebase */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-2">
          {isSyncing ? (
            <>
              <CloudUpload className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-amber-300 font-medium">Sincronizando con Firebase Firestore...</span>
            </>
          ) : isCloudSynced ? (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Base de Datos en la Nube Activa</span>
              <span className="text-slate-500">• Todos tus productos se guardan automáticamente</span>
            </>
          ) : (
            <>
              <CloudUpload className="w-3.5 h-3.5 text-blue-400" />
              <span>Conectando a Firebase Firestore...</span>
            </>
          )}
        </div>
        <div className="font-mono text-slate-500 text-[10px]">
          Firestore DB: ai-studio-deco3d
        </div>
      </div>

      {/* Notificación Toast flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-sm font-semibold flex items-center space-x-2 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Contenido Principal según Pestaña */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'catalog' && (
          <CatalogView
            items={catalogItems}
            onToggleStock={handleToggleStock}
            onDeleteItem={handleDeleteItem}
            onUpdateItem={handleUpdateItem}
            onOpenGenerator={() => setActiveTab('generator')}
          />
        )}

        {activeTab === 'generator' && (
          <VariantMultiplier
            baseProducts={baseProducts}
            onAddProductsToCatalog={handleAddProductsToCatalog}
            onClose={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'studio' && <ColorStudioPlayground />}

        {activeTab === 'export' && (
          <ExportModal
            items={catalogItems}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">Deco 3D Studio</span>
          <span>• Catálogo & Multiplicador de Variantes Fotográficas</span>
        </div>
        <div className="flex items-center space-x-4 text-[11px] text-slate-400">
          <span>{catalogItems.length} productos en catálogo</span>
          <span className="text-emerald-500 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Nube Activa
          </span>
        </div>
      </footer>
    </div>
  );
}
