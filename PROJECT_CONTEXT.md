# PROJECT CONTEXT - DECO 3D STUDIO
> Archivo Maestro de Memoria Técnica y Estado del Proyecto para Continuidad y Nuevos Sprints.

---

## 📌 1. Visión y Propósito
**Deco 3D Studio** es una plataforma SaaS/Web profesional diseñada para fabricantes e impresores 3D (PLA / PETG).
Permite tomar una única sesión fotográfica de un prototipo real (por ejemplo, Dummy 13 articulado, macetas geométricas, figuras articuladas o deco) y multiplicar automáticamente todo el catálogo a decenas de colores de filamento comerciales, generando publicaciones unitarias fotorrealistas con hasta 10 fotos en alta resolución por producto, listas para Mercado Libre, Meta Commerce y WhatsApp Catalog.

---

## 🏗️ 2. Stack Tecnológico & Infraestructura
* **Frontend**: React 19 + TypeScript + Vite.
* **Estilos**: Tailwind CSS v4.
* **Base de Datos en la Nube**: Google Firebase Firestore (Database ID: `ai-studio-deco3dcatlogoyva-0c2a54d4-ed24-442d-891f-f975a5382ec1`).
* **Control de Versiones**: Git + GitHub (`https://github.com/elpepavm/deco3d-catalog.git` en rama `main`).
* **Iconografía**: Lucide React.
* **Configuración Firebase**: `firebase-applet-config.json`, `firebase-blueprint.json`, `firestore.rules`.

---

## 🎨 3. Motor Fotorrealista de Colorimetría (`src/utils/recolorEngine.ts`)

El núcleo técnico de la aplicación es un algoritmo matemático de transformación de píxeles en Canvas 2D que supera a los tintes planos tradicionales:

### A. Iluminación Relativa (`shadeRatio`)
* En lugar de pintar un color sólido, calcula la relación de luminancia del píxel original respecto a la muestra base (`pixelLum / baseSampleLum`).
* Multiplica el color de filamento objetivo por esa proporción.
* **Resultado**: Preserva al 100% las sombras proyectadas, luces especulares, biseles, facetas poliédricas, oclusiones ambientales y las líneas de capa de impresión 3D (0.2mm).

### B. Calibración Especial para Blanco PLA (`isWhiteTarget`)
* El blanco no se estira al máximo ciego (evita quemar los bordes). Se calibra con un techo suave entre `240 - 244`.
* Mantiene contraste con el fondo blanco de estudio.
* **Descontaminación cromática (Anti-Halos)**: Detecta y neutraliza los rebotes de color original (ej. halos celestes/aqua) en los bordes y zonas de transición hacia el blanco.

### C. Calibración Especial para Negro Satinado / Carbón PLA (`isBlackTarget`)
* Implementa una curva de luminancia no lineal que evita el "negro empastado" sin volumen.
* **Sombras profundas**: `~24` (nunca 0 absoluto).
* **Medios tonos**: `48 - 68`.
* **Altas luces / Reflejos de aristas**: `85 - 108`.
* **Resultado**: Las caras, filos y biseles de las piezas negras se leen con claridad tridimensional idéntica a una foto real de filamento negro satinado.

### D. Sistemas de Blindaje Inteligente (Protección de Áreas)
1. **Blindaje de Piel Biológica Humana (`protectSkin`)**:
   * Algoritmo híbrido HSV + YCbCr calibrado para tonos de piel reales (manos y dedos que sostienen la pieza en las fotos).
   * Evita que la mano cambie de color al transformar el producto.
2. **Blindaje de Articulaciones y Accesorios Oscuros (`protectJoints`)**:
   * Protege bolas, encastres, articulaciones de bola y armas/accesorios negros o grises muy oscuros.
3. **Cuentagotas de Blindaje Personalizado (`shieldColorHex`)**:
   * Permite hacer clic en cualquier color de la foto para protegerlo con su propio radio de tolerancia.

### E. Parámetros de Ajuste del Motor
* **Tolerancia Angular de Matiz (Hue)**: `0°` a `180°` (por defecto `40°` para colores puros, ampliable a `80°-100°` para espectros amplios como Cyan/Aqua).
* **Suavizado de Bordes (Feather)**: `0` a `50` (interpolación suave anti-serrucho).
* **Rango de Luminancia**: Filtro para evitar intervenir fondos muy quemados o sombras puras.

---

## 🗄️ 4. Base de Datos & Persistencia (`src/utils/firebase.ts`)
* **Colección `/catalog_items`**: Guarda cada publicación unitaria generada (ID, título, SKU, filamento, precio, medidas, stock, fotos en Base64/URL, fecha).
* **Colección `/base_products`**: Guarda los modelos 3D base (Dummy 13, Maceta, etc.) con sus fotos originales y ajustes calibrados.
* **Sincronización en Tiempo Real (`subscribeToCatalog`)**:
  * Actualización optimista instantánea en UI + persistencia en background.
  * Cambios de stock con un clic (`toggleStockInCloud`).
  * Eliminación permanente sincronizada (`deleteCatalogItemFromCloud`).
  * Lotes de generación masiva (`saveCatalogBatchToCloud`).

---

## 📁 5. Estructura de Archivos Clave
```
├── firebase-applet-config.json   # Configuración de conexión Firebase
├── firebase-blueprint.json       # Esquema formal de datos
├── firestore.rules               # Reglas de seguridad de base de datos
├── PROJECT_CONTEXT.md            # Este archivo maestro
├── README.md                     # Documentación general del repositorio
├── src/
│   ├── App.tsx                   # Estado global, tabs y sincronización Firebase
│   ├── types.ts                  # Interfaces TypeScript (CatalogItem, BaseProduct, Filament)
│   ├── components/
│   │   ├── Navbar.tsx            # Navegación y métricas de stock
│   │   ├── CatalogView.tsx       # Grilla de publicaciones unitarias con visor de fotos
│   │   ├── VariantMultiplierModal.tsx # Generador masivo de variantes con fotos múltiples
│   │   ├── ColorStudioPlayground.tsx  # Laboratorio de calibración y prueba en vivo
│   │   ├── ImageZoomLightbox.tsx      # Modal de zoom 400%, paneo y comparador antes/después
│   │   └── ExportModal.tsx       # Exportación CSV para Meta Commerce y WhatsApp
│   ├── data/
│   │   ├── filaments.ts          # Paleta oficial de filamentos (Grilon3, Printalot, etc.)
│   │   ├── initialCatalog.ts     # Datos semilla de inicialización
│   │   └── sampleImages.ts       # Fotos base de Dummy 13 y macetas
│   └── utils/
│       ├── recolorEngine.ts      # Motor matemático de colorimetría fotorrealista
│       └── firebase.ts           # Cliente Firestore y sincronización
```

---

## 🚀 6. Guía para Nuevos Sprints o Nuevos Chats
Si iniciás un nuevo chat o sesión limpia en Google AI Studio:
1. Clonar / Importar el repositorio desde GitHub: `https://github.com/elpepavm/deco3d-catalog.git`.
2. Indicar a la IA:
   > *"Por favor leé el archivo PROJECT_CONTEXT.md en la raíz del proyecto para entender la arquitectura, el motor de colorimetría y las integraciones de Firebase antes de implementar los siguientes cambios: [tus requerimientos]"*.
3. La IA tendrá el 100% de la precisión técnica sin alucinaciones ni pérdida de calibraciones previas.
