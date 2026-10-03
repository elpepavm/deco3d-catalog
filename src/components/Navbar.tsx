import React from 'react';
import { Layers, Palette, Package, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react';

export type NavigationTab = 'inbox' | 'review' | 'catalog' | 'export';

interface NavbarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  inboxCount: number;
  reviewCount: number;
  totalProducts: number;
  inStockCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  inboxCount,
  reviewCount,
  totalProducts,
  inStockCount,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo y Branding */}
          <div 
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0" 
            onClick={() => setActiveTab('catalog')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-indigo-500 flex items-center justify-center shadow-md shadow-rose-500/20">
              <Layers className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  <span className="inline sm:hidden">Deco3D</span>
                  <span className="hidden sm:inline">Deco3D Studio</span>
                </span>
                <span className="hidden lg:inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Meta Live
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-400">
                Pipeline de 3 Estados & Feed para WhatsApp
              </p>
            </div>
          </div>

          {/* Navegación de pestañas: Pipeline de 3 Estados + Herramientas */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1">
            {/* Paso 1: Bandeja de Entrada */}
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'inbox'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-mono text-[9px] sm:text-[10px] font-bold">1</span>
              <span>Bandeja</span>
              {inboxCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[9px] sm:text-[10px] font-bold">
                  {inboxCount}
                </span>
              )}
            </button>

            {/* Paso 2: En Revisión */}
            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'review'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono text-[9px] sm:text-[10px] font-bold">2</span>
              <span>Revisión</span>
              {reviewCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-extrabold animate-pulse">
                  {reviewCount}
                </span>
              )}
            </button>

            {/* Paso 3: Catálogo Activo */}
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'catalog'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono text-[9px] sm:text-[10px] font-bold">3</span>
              <Package className="w-3.5 h-3.5 hidden sm:inline" />
              <span>Catálogo ({totalProducts})</span>
            </button>

            {/* Sincronización Meta Feed */}
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'export'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Feed Meta para WhatsApp / Instagram"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Feed Meta</span>
              <span className="inline sm:hidden">Feed</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
