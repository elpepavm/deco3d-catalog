import React, { useState, useEffect } from 'react';
import { BaseProduct, CatalogItem, InboxItem } from './types';
import { getInitialBaseProducts, getInitialCatalogItems } from './data/initialCatalog';
import { Navbar, NavigationTab } from './components/Navbar';
import { CatalogView } from './components/CatalogView';
import { InboxPipelineView } from './components/InboxPipelineView';
import { ReviewPipelineView } from './components/ReviewPipelineView';
import { ExportModal } from './components/ExportModal';
import { BatchEditUpdates } from './components/BatchEditModal';
import { 
  subscribeToCatalog, 
  saveCatalogBatchToCloud, 
  saveCatalogItemToCloud,
  toggleStockInCloud, 
  deleteCatalogItemFromCloud,
  deleteCatalogBatchFromCloud,
  subscribeToBaseProducts,
  saveBaseProductToCloud
} from './utils/firebase';
import { CloudCheck, CloudUpload } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('catalog');
  const [baseProducts, setBaseProducts] = useState<BaseProduct[]>(getInitialBaseProducts);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(getInitialCatalogItems);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
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

  // Separación del Pipeline: Borradores vs Publicados en Catálogo Activo
  const publishedItems = catalogItems.filter((i) => i.status !== 'draft');
  const draftItems = catalogItems.filter((i) => i.status === 'draft');

  // --- Handlers de Bandeja de Entrada (Paso 1) ---
  const handleAddInboxItem = (item: InboxItem) => {
    setInboxItems((prev) => [item, ...prev]);
    showToast('📥 Foto añadida a la Bandeja de Entrada.');
  };

  const handleRemoveInboxItem = (id: string) => {
    setInboxItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateInboxItem = (updated: InboxItem) => {
    setInboxItems((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
  };

  // Cuando se procesan las fotos de la bandeja y se generan variantes en "Revisión"
  const handleGenerateToReview = (generatedItems: CatalogItem[], inboxItemId: string) => {
    setCatalogItems((prev) => [...generatedItems, ...prev]);
    setInboxItems((prev) => prev.filter((i) => i.id !== inboxItemId));
    showToast(`⚡ ${generatedItems.length} variantes generadas. Pasaron a Revisión.`);
    setActiveTab('review');
  };

  // --- Handlers de En Revisión (Paso 2) ---
  const handleApproveItem = async (id: string) => {
    const item = catalogItems.find((i) => i.id === id);
    if (!item) return;

    const approvedItem: CatalogItem = { ...item, status: 'published' };

    setCatalogItems((prev) =>
      prev.map((i) => (i.id === id ? approvedItem : i))
    );
    showToast(`✅ "${approvedItem.title}" aprobado y publicado en WhatsApp.`);

    try {
      await saveCatalogItemToCloud(approvedItem);
    } catch (err) {
      console.error('Error al guardar producto aprobado en Firestore:', err);
    }
  };

  const handleApproveAll = async () => {
    const approvedBatch = draftItems.map((d) => ({
      ...d,
      status: 'published' as const,
    }));

    setCatalogItems((prev) =>
      prev.map((i) => (i.status === 'draft' ? { ...i, status: 'published' } : i))
    );

    showToast(`🚀 ${approvedBatch.length} productos aprobados y publicados.`);
    setActiveTab('catalog');

    try {
      await saveCatalogBatchToCloud(approvedBatch);
    } catch (err) {
      console.error('Error al guardar lote aprobado en Firestore:', err);
    }
  };

  const handleDiscardItem = async (id: string) => {
    setCatalogItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Borrador descartado.');

    try {
      await deleteCatalogItemFromCloud(id);
    } catch (err) {
      console.error('Error al borrar borrador en Firestore:', err);
    }
  };

  const handleDiscardAll = () => {
    setCatalogItems((prev) => prev.filter((i) => i.status !== 'draft'));
    showToast('Todos los borradores fueron descartados.');
  };

  // --- Handlers de Operaciones en Lote (Batch Operations) ---
  const handleApproveBatch = async (ids: string[]) => {
    const approvedBatch: CatalogItem[] = [];
    setCatalogItems((prev) =>
      prev.map((i) => {
        if (ids.includes(i.id)) {
          const approved = { ...i, status: 'published' as const };
          approvedBatch.push(approved);
          return approved;
        }
        return i;
      })
    );
    showToast(`🚀 ${approvedBatch.length} productos aprobados y publicados.`);
    try {
      await saveCatalogBatchToCloud(approvedBatch);
    } catch (err) {
      console.error('Error al guardar lote aprobado en Firestore:', err);
    }
  };

  const handleDiscardBatch = async (ids: string[]) => {
    setCatalogItems((prev) => prev.filter((i) => !ids.includes(i.id)));
    showToast(`🗑️ ${ids.length} borradores descartados.`);
    try {
      await deleteCatalogBatchFromCloud(ids);
    } catch (err) {
      console.error('Error al borrar lote en Firestore:', err);
    }
  };

  const handleBatchUpdate = async (ids: string[], updates: BatchEditUpdates) => {
    const updatedBatch: CatalogItem[] = [];
    setCatalogItems((prev) =>
      prev.map((item) => {
        if (!ids.includes(item.id)) return item;
        const updated: CatalogItem = {
          ...item,
          price: updates.price !== undefined ? updates.price : item.price,
          salePrice:
            updates.salePrice === null
              ? undefined
              : updates.salePrice !== undefined
              ? updates.salePrice
              : item.salePrice,
          category: updates.category !== undefined ? updates.category : item.category,
          inStock: updates.inStock !== undefined ? updates.inStock : item.inStock,
          dimensions: updates.dimensions !== undefined ? updates.dimensions : item.dimensions,
        };
        updatedBatch.push(updated);
        return updated;
      })
    );
    showToast(`✅ ${ids.length} productos actualizados en lote.`);
    try {
      await saveCatalogBatchToCloud(updatedBatch);
    } catch (err) {
      console.error('Error al guardar actualización en lote en Firestore:', err);
    }
  };

  const handleBatchToggleStock = async (ids: string[], inStock: boolean) => {
    const updatedBatch: CatalogItem[] = [];
    setCatalogItems((prev) =>
      prev.map((item) => {
        if (!ids.includes(item.id)) return item;
        const updated = { ...item, inStock };
        updatedBatch.push(updated);
        return updated;
      })
    );
    showToast(`📦 ${ids.length} productos marcados como ${inStock ? 'En Stock' : 'Sin Stock'}.`);
    try {
      await saveCatalogBatchToCloud(updatedBatch);
    } catch (err) {
      console.error('Error al actualizar stock en lote:', err);
    }
  };

  const handleDeleteBatch = async (ids: string[]) => {
    setCatalogItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    showToast(`🗑️ ${ids.length} productos eliminados del catálogo.`);
    try {
      await deleteCatalogBatchFromCloud(ids);
    } catch (err) {
      console.error('Error al eliminar lote en Firestore:', err);
    }
  };

  // --- Handlers de Catálogo Activo (Paso 3) ---
  const handleToggleStock = async (id: string) => {
    const item = catalogItems.find((i) => i.id === id);
    const newStock = item ? !item.inStock : false;

    setCatalogItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, inStock: newStock } : i))
    );

    try {
      await toggleStockInCloud(id, newStock);
    } catch (err) {
      console.error('Error al actualizar stock en la nube:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setCatalogItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Producto eliminado del catálogo.');

    try {
      await deleteCatalogItemFromCloud(id);
    } catch (err) {
      console.error('Error al borrar de Firestore:', err);
    }
  };

  const handleUpdateItem = async (updatedItem: CatalogItem) => {
    setCatalogItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    showToast(`✅ "${updatedItem.title}" actualizado con éxito.`);

    try {
      await saveCatalogItemToCloud(updatedItem);
    } catch (err) {
      console.error('Error al actualizar en Firestore:', err);
      showToast('⚠️ Guardado localmente. Error al sincronizar con Firestore.');
    }
  };

  const handleAddProductsToCatalog = async (newItems: CatalogItem[]) => {
    setIsSyncing(true);
    setCatalogItems((prev) => [...newItems, ...prev]);
    showToast(`¡Se crearon con éxito ${newItems.length} publicaciones unitarias con sus fotos!`);
    setActiveTab('catalog');

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

  const inStockCount = publishedItems.filter((i) => i.inStock).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Barra de Navegación Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inboxCount={inboxItems.length}
        reviewCount={draftItems.length}
        totalProducts={publishedItems.length}
        inStockCount={inStockCount}
      />

      {/* Notificación Toast flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-sm font-semibold flex items-center space-x-2 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Contenido Principal según Pestaña */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Paso 1: Bandeja de Entrada */}
        {activeTab === 'inbox' && (
          <InboxPipelineView
            inboxItems={inboxItems}
            onAddInboxItem={handleAddInboxItem}
            onRemoveInboxItem={handleRemoveInboxItem}
            onUpdateInboxItem={handleUpdateInboxItem}
            onGenerateToReview={handleGenerateToReview}
          />
        )}

        {/* Paso 2: En Revisión */}
        {activeTab === 'review' && (
          <ReviewPipelineView
            draftItems={draftItems}
            onApproveItem={handleApproveItem}
            onApproveAll={handleApproveAll}
            onApproveBatch={handleApproveBatch}
            onDiscardItem={handleDiscardItem}
            onDiscardAll={handleDiscardAll}
            onDiscardBatch={handleDiscardBatch}
            onUpdateDraftItem={handleUpdateItem}
            onBatchUpdateDrafts={handleBatchUpdate}
            onGoToActiveCatalog={() => setActiveTab('catalog')}
          />
        )}

        {/* Paso 3: Catálogo Activo */}
        {activeTab === 'catalog' && (
          <CatalogView
            items={publishedItems}
            onToggleStock={handleToggleStock}
            onDeleteItem={handleDeleteItem}
            onUpdateItem={handleUpdateItem}
            onOpenGenerator={() => setActiveTab('inbox')}
            onBatchUpdate={handleBatchUpdate}
            onDeleteBatch={handleDeleteBatch}
            onBatchToggleStock={handleBatchToggleStock}
          />
        )}

        {activeTab === 'export' && (
          <ExportModal
            items={publishedItems}
          />
        )}
      </main>

      {/* Footer con resumen sutil de sincronización */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 sm:px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-300">Deco 3D Studio</span>
          <span className="hidden sm:inline text-slate-400">•</span>
          <span className="text-[11px] text-slate-400">{publishedItems.length} productos en catálogo</span>
        </div>

        {/* Resumen sutil de Nube (trasladado aquí para mantener el menú superior limpio) */}
        <div className="flex items-center space-x-3 text-[11px]">
          {isSyncing ? (
            <span className="flex items-center gap-1.5 text-amber-500 font-medium">
              <CloudUpload className="w-3.5 h-3.5 animate-pulse" />
              <span>Sincronizando...</span>
            </span>
          ) : isCloudSynced ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CloudCheck className="w-3.5 h-3.5" />
              <span>Nube conectada y sincronizada</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-400">
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Conectando...</span>
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}

