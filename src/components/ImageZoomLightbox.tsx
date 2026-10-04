import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ExternalLink, 
  Download, 
  Maximize2,
  Layers,
  Move
} from 'lucide-react';

interface ImageZoomLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  compareImageUrl?: string;
  compareTitle?: string;
}

export const ImageZoomLightbox: React.FC<ImageZoomLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  compareImageUrl,
  compareTitle = 'Original',
}) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Modo de visualización: imagen actual o comparación lado a lado
  const [activeTab, setActiveTab] = useState<'current' | 'compare' | 'split'>('current');
  const [splitPos, setSplitPos] = useState<number>(50);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset zoom al abrir
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setActiveTab('current');
    }
  }, [isOpen, imageUrl]);

  // Tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === '0') handleReset();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale]);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(4, Number((prev + 0.35).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(0.6, Number((prev - 0.35).toFixed(2)));
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom con rueda del mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Paneo con arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    const targetUrl = activeTab === 'compare' && compareImageUrl ? compareImageUrl : imageUrl;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-hd.png`;
    a.click();
  };

  const currentDisplayImg = activeTab === 'compare' && compareImageUrl ? compareImageUrl : imageUrl;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md select-none animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* BARRA SUPERIOR */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80 text-white z-20"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
            <Maximize2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400">
              Usa la rueda del mouse o los botones para hacer zoom • Arrastra para mover • Clic fuera o Esc para cerrar
            </p>
          </div>
        </div>

        {/* SELECTOR DE MODO DE COMPARACIÓN (SI EXISTE COMPARACIÓN) */}
        {compareImageUrl && (
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'current'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Resultado
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'compare'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {compareTitle}
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                activeTab === 'split'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Comparar (Cortina)
            </button>
          </div>
        )}

        {/* ACCIONES DE ZOOM Y SALIDA */}
        <div className="flex items-center space-x-2">
          {/* Controles de Zoom */}
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-slate-300">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
              title="Alejar (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 min-w-[50px] text-center font-bold text-slate-200">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
              title="Acercar (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-slate-700 hover:text-white transition-colors border-l border-slate-700 pl-2"
              title="Restablecer tamaño (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Abrir en nueva pestaña */}
          <a
            href={currentDisplayImg}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Abrir imagen en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Descargar PNG */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Descargar en alta resolución"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Cerrar */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/50 transition-all ml-2"
            title="Cerrar (Esc o clic afuera)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ÁREA DE VISUALIZACIÓN INTERACTIVA */}
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onClick={(e) => {
          if (e.target === containerRef.current) {
            onClose();
          }
        }}
        className={`flex-1 relative overflow-hidden flex items-center justify-center p-4 ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
      >
        {activeTab === 'split' && compareImageUrl ? (
          // Vista de Cortina dentro del Lightbox
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] aspect-square w-full h-full flex items-center justify-center rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* Imagen Resultante */}
            <img
              src={imageUrl}
              alt="Resultado"
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Imagen Original con recorte */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${splitPos}%` }}
            >
              <img
                src={compareImageUrl}
                alt="Original"
                className="w-full h-full object-contain pointer-events-none"
                style={{ width: containerRef.current?.clientWidth || '100%', maxWidth: 'none' }}
              />
            </div>

            {/* Línea divisoria */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow-lg pointer-events-none"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-rose-600 text-white shadow-xl flex items-center justify-center text-xs font-bold">
                ↔
              </div>
            </div>

            {/* Slider transparente */}
            <input
              type="range"
              min="0"
              max="100"
              value={splitPos}
              onChange={(e) => setSplitPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
            />
          </div>
        ) : (
          // Vista Normal con Zoom y Paneo
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && scale <= 1) {
                onClose();
              }
            }}
            className="flex items-center justify-center w-full h-full"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <img
              src={currentDisplayImg}
              alt={title}
              onClick={(e) => {
                if (scale <= 1) {
                  e.stopPropagation();
                  handleZoomIn();
                }
              }}
              className={`max-w-[90vw] max-h-[85vh] object-contain drop-shadow-2xl ${scale <= 1 ? 'cursor-zoom-in' : 'cursor-grab'}`}
            />
          </div>
        )}

        {/* Indicador de ayuda flotante */}
        {scale > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-800 shadow-lg flex items-center gap-1.5 backdrop-blur-xs pointer-events-none">
            <Move className="w-3.5 h-3.5 text-rose-400" />
            <span>Haz clic y arrastra para explorar • Clic afuera o Esc para cerrar</span>
          </div>
        )}
      </div>
    </div>
  );
};
