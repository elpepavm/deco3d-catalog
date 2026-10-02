# 📖 PROJECT CONTEXT - DECO 3D STUDIO (AUDITORÍA & ESPECIFICACIÓN TOTAL 100%)
> **Documento Maestro de Arquitectura, Algoritmos, Estructuras de Datos, UI y Lógica de Negocio.**
> Verificado de pies a cabeza contra el 100% del código fuente del repositorio.

---

## 📌 1. Visión y Propósito del Sistema
* **Nombre de la Aplicación**: Deco 3D Studio.
* **Propósito**: Plataforma SaaS para talleres y fabricantes de impresión 3D (PLA / PETG / ABS).
* **Problema resuelto**: Evita imprimir y fotografiar físicamente 25 colores de cada modelo 3D. A partir de una única sesión fotográfica del prototipo real (en estudio o sostenido en mano), el motor multiplica fotorrealistamente hasta 10 fotos en alta resolución por cada color de filamento comercial, generando publicaciones unitarias con SKU único, stock, precio en ARS y fotos listas para e-commerce.

---

## 🛠️ 2. Stack Tecnológico & Dependencias (`package.json`)
* **Core**: React 19.0.1 + React DOM 19.0.1 + TypeScript 7.0.2 + Vite 8.3.0.
* **Estilos**: Tailwind CSS v4.3.3 (`@tailwindcss/vite` + `@import "tailwindcss";` nativo).
* **Base de Datos**: Google Firebase Firestore SDK v12.x.
  * **Database ID**: `ai-studio-deco3dcatlogoyva-0c2a54d4-ed24-442d-891f-f975a5382ec1`.
  * **Configuración**: `firebase-applet-config.json`.
  * **Reglas**: `firestore.rules`.
  * **Esquema IR**: `firebase-blueprint.json`.
* **Iconos**: `lucide-react` v0.546.0.
* **Animaciones**: `motion` v12.23.24.
* **Backend de desarrollo**: Express 4.21.2 + tsx 4.21.0 + dotenv 17.2.3.
* **Repositorio GitHub**: `https://github.com/elpepavm/deco3d-catalog.git` (rama `main`).

---

## 🗄️ 3. Modelos de Datos Exhaustivos (`src/types.ts`)

```typescript
// Tipos de fotos admitidas por cada producto
export type ImageType = 'cover' | 'hand' | 'detail' | 'angle' | 'extra';

// Foto individual de un modelo base
export interface ProductImage {
  id: string;
  type: ImageType;
  label: string; // Ej: "Foto 1: Portada (Estudio)", "Foto 2: En Mano (Escala)"
  url: string;   // Base64 Data URL o URL externa
  sourceColor?: string; // Color hexadecimal de la muestra original
}

// Foto en la publicación unitaria del catálogo
export interface CatalogImageItem {
  id: string;
  label: string;
  url: string;
  type?: ImageType;
}

// Definición de color de filamento comercial
export interface FilamentColor {
  id: string;
  name: string;
  hex: string;
  category: 'basico' | 'pastel' | 'silk' | 'especial';
  material: 'PLA' | 'PETG' | 'ABS' | 'TPU';
}

// Variante generada
export interface ProductVariant {
  id: string;
  productId: string;
  colorName: string;
  colorHex: string;
  material: string;
  sku: string;
  price: number;
  inStock: boolean;
  images: {
    type: ImageType;
    url: string;
  }[];
  createdAt: string;
}

// Modelo 3D base (plantilla)
export interface BaseProduct {
  id: string;
  title: string;           // Ej: "DUMMY 13 - Verde Oliva / Pistacho"
  category: string;        // Ej: "Figuras Articuladas"
  basePrice: number;       // Ej: 8500
  description: string;
  dimensions: string;      // Ej: "14.5 cm de alto"
  printTime?: string;      // Ej: "4.5 hs"
  skuBase: string;         // Ej: "DUM13"
  images: ProductImage[];  // Hasta 10 fotos base
  sourceColorHex: string;  // Color original detectado o elegido (ej: "#959b2a")
  tolerance: number;       // 15 - 80 (angular)
  feather: number;         // 0 - 50 (suavizado)
  protectSkin: boolean;    // Blindaje de manos
  protectNeutrals: boolean;// Blindaje de articulaciones negras y fondo
}

// Publicación unitaria final en el catálogo
export interface CatalogItem {
  id: string;
  baseProductId: string;
  variantId: string;
  title: string;          // Ej: "DUMMY 13 - Amarillo Sol PLA"
  colorName: string;      // Ej: "Amarillo"
  colorHex: string;       // Ej: "#F5D63B"
  material: string;       // Ej: "PLA"
  category: string;       // Ej: "Figuras Articuladas"
  price: number;          // Precio de venta en ARS
  sku: string;            // Ej: "DUM13-PLA-AMA-01"
  inStock: boolean;       // Control de inventario en vivo
  description: string;
  dimensions: string;
  coverImage: string;     // URL de la foto principal
  handImage?: string;     // URL opcional de la foto en mano
  images: CatalogImageItem[]; // Lista completa de fotos (hasta 10 fotos por producto)
  createdAt: string;      // Timestamp ISO
}
```

---

## 🎨 4. Paleta Oficial de Filamentos (`src/data/filaments.ts`)

La aplicación incluye los **25 colores comerciales exactos** del mercado argentino y regional (Grilon3 / Printalot):
1. **Amarillo**: `#F5D63B` (Básico, PLA)
2. **Aqua**: `#2AC8D1` (Especial, PLA)
3. **Arena**: `#EEDCA5` (Pastel, PLA)
4. **Azul**: `#163ADE` (Básico, PLA)
5. **Blanco**: `#FFFFFF` (Básico, PLA)
6. **Bronce**: `#544C2D` (Silk/Seda, PLA)
7. **Celeste**: `#4F8FCE` (Pastel, PLA)
8. **Cobalto**: `#19345E` (Especial, PLA)
9. **Dorado**: `#C4B131` (Silk/Seda, PLA)
10. **Fucsia**: `#D82678` (Especial, PLA)
11. **Gris**: `#8E8F94` (Básico, PLA)
12. **Gris Grafito**: `#404551` (Básico, PLA)
13. **Kiwi**: `#87D0A3` (Pastel, PLA)
14. **Lila**: `#AEB1D2` (Pastel, PLA)
15. **Marrón**: `#4A2A0A` (Especial, PLA)
16. **Marrón Claro**: `#8A6A50` (Especial, PLA)
17. **Naranja**: `#E05E16` (Básico, PLA)
18. **Negro**: `#111827` (Básico, PLA)
19. **Piel**: `#F2D3BF` (Pastel, PLA)
20. **Rojo**: `#DC2626` (Básico, PLA)
21. **Rosa**: `#E5BEF5` (Pastel, PLA)
22. **Rosa Claro**: `#CEC0CF` (Pastel, PLA)
23. **Verde**: `#048A40` (Básico, PLA)
24. **Verde Claro**: `#5FD46F` (Pastel, PLA)
25. **Violeta**: `#706DA6` (Especial, PLA)

### Categorías Oficiales del Catálogo (`CATEGORIES`)
* `Todos`
* `Figuras Articuladas`
* `Soportes y Accesorios`
* `Decoración y Macetas`
* `Juguetes y Antiestrés`
* `Hogar y Oficina`

---

## 🧮 5. Motor Fotorrealista de Colorimetría (`src/utils/recolorEngine.ts`)

### 5.1. Conversiones y Fórmulas Matemáticas
* **Luminancia Ponderada (ITU-R BT.601)**:
  $$L = 0.299 \cdot R + 0.587 \cdot G + 0.114 \cdot B$$
* **Distancia Circular de Matiz ($0° - 180°$)**:
  $$d = |h_1 - h_2| \pmod{360}, \quad \text{dist} = \min(d, 360 - d)$$
* **Distancia Perceptual RGB Ponderada (Fórmula de Redmean)**:
  $$\bar{r} = \frac{r_1 + r_2}{2}$$
  $$\Delta C = \sqrt{\left(2 + \frac{\bar{r}}{256}\right)\Delta r^2 + 4\Delta g^2 + \left(2 + \frac{255 - \bar{r}}{256}\right)\Delta b^2}$$

### 5.2. Aislamiento y Blindaje de Piel Humana (`isHumanSkin`)
* Evalúa simultáneamente en espacios HSV y YCbCr:
  * **Matiz cálido**: $H \in [0°, 38°]$ o $H \in [345°, 360°]$.
  * **Saturación**: $S \in [0.12, 0.72]$.
  * **Brillo**: $V \in [0.22, 0.98]$.
  * **Espacio YCbCr**: $Cb \in [77, 133]$, $Cr \in [130, 175]$, $Y \in [35, 245]$.
* **Garantía**: Las manos, dedos y uñas que sostienen al Dummy 13 quedan 100% blindadas.

### 5.3. Aislamiento de Articulaciones y Armas Negras
* **Fondo Blanco de Estudio**: Si $V > 0.92$ y $S < 0.12$, se ignora.
* **Articulaciones y Encastres**: Si $V < 0.20$, se ignora.
* **Armas Negras y Cuchillos**: Si $\text{Chroma} < \min(0.20, \text{srcChroma} \cdot 0.36)$ y $V < 0.88$, se ignora.

### 5.4. Calibración Especial: Blanco PLA (`#FFFFFF`)
```typescript
const whiteLuma = Math.min(244, Math.round(172 + Math.pow(normShade, 0.68) * 70));
recoloredRgb = { r: whiteLuma, g: whiteLuma, b: whiteLuma };
```
* **Luces**: Techo en `244` (no satura ni se quema con el fondo `#FFFFFF`).
* **Sombras**: `195 - 215` (relieve del grabado "13" y biseles nítidos).
* **Hendiduras**: `175 - 190`.

### 5.5. Calibración Especial: Negro Satinado / Charcoal PLA (`#111827`)
```typescript
const satinLuma = Math.round(22 + Math.pow(normShade, 0.72) * 78);
recoloredRgb = { r: satinLuma, g: satinLuma, b: Math.min(255, satinLuma + 3) };
```
* **Sombras de unión**: `~22 - 24`.
* **Caras planas**: `~48 - 68`.
* **Aristas y reflejos**: `~85 - 108`.

### 5.6. Descontaminación Cromática Anti-Halos
* En los bordes externos de transición ($hDist \in [maxAngle, maxAngle + featherAngle \cdot 1.8]$):
  $$\text{pixel}_{\text{decontam}} = 0.4 \cdot \text{pixel}_{\text{orig}} + 0.6 \cdot \text{neutralLuma}$$
* **Resultado**: Elimina completamente halos celestes, aqua o rojos residuales en los límites de la pieza.

### 5.7. Detección Automática de Color Predominante (`detectDominantPlasticColor`)
* Muestrea un canvas reducido de $180 \times 180$ px.
* Filtra fondo blanco, articulaciones oscuras y piel.
* Agrupa en un histograma de **36 buckets de matiz** (cada uno de 10°).
* Retorna el color promedio RGB del bucket ganador en formato HEX.

---

## 💻 6. Arquitectura de Pantallas y Componentes

### 6.1. `Navbar.tsx`
* Indicador de marca "Deco 3D Studio".
* 4 Pestañas: `Catálogo`, `Multiplicador`, `Laboratorio Studio`, `Exportar`.
* Badge de métricas: total de publicaciones y productos en stock.
* Barra superior sutil de estado de conexión a Firebase en tiempo real (`🟢 Base de Datos en la Nube Activa`).

### 6.2. `CatalogView.tsx`
* Búsqueda en tiempo real por texto (título, filamento, SKU, categoría).
* Filtros por chips de categoría y por disponibilidad de stock (`Todos`, `En Stock`, `Sin Stock`).
* Tarjetas de producto individuales:
  * **Carrusel de Fotos**: Navegación por flechas o miniaturas de hasta 10 fotos por publicación.
  * **Indicador de Foto**: Etiqueta con el número de foto (`1/4`, etc.) y tipo.
  * **Badge de Stock**: Botón interactivo que conmuta el estado de stock en memoria y en Firestore.
  * **Chip de SKU**: Al hacer clic, copia el SKU al portapapeles y muestra un check verde durante 2 segundos.
  * **Botón WhatsApp Directo**: Genera enlace `wa.me` con el mensaje:
    > *"Hola! Me interesa la figura \*[Título]\* (SKU: \*[SKU]\*). Material: [Material], Color: [Color], Precio: $[Precio]. ¿Tienen disponibilidad para entrega o envío?"*
  * **Lightbox Zoom**: Clic en cualquier foto abre el modal a pantalla completa.
  * **Eliminar**: Botón para dar de baja la publicación con sincronización con Firestore.

### 6.3. `VariantMultiplierModal.tsx`
* **Selector de Modelo Base**: Elegir prototipo (Dummy 13 Oliva, Dummy 13 Rojo, Maceta Origami) o cargar uno nuevo.
* **Cargador Multifoto**: Subida de hasta 10 fotos por modelo, con selector de tipo (`cover`, `hand`, `detail`, `angle`, `extra`) y etiqueta.
* **Calibración Interactiva**:
  * Cuentagotas para seleccionar el color original directamente sobre la foto.
  * Deslizador de Tolerancia angular ($10° - 90°$).
  * Deslizador de Suavizado / Feather ($1 - 40$).
  * Toggles de blindaje: Piel humana y articulaciones/accesorios oscuros.
  * **Previsualización multifoto en tiempo real**: Muestra todas las fotos cargadas procesadas simultáneamente al mover los controles.
* **Selector de Filamentos**:
  * Selección individual o masiva de los 25 filamentos comerciales.
  * Opción de crear filamentos personalizados (Hex + Nombre).
* **Generación en Lote**:
  * Multiplica $N$ colores $\times$ $M$ fotos.
  * Genera SKUs correlativos automáticos (`DUM13-PLA-ROJ-01`, `DUM13-PLA-BLA-02`).
  * Persistencia en Firestore en bloques de hasta 400 documentos (`saveCatalogBatchToCloud`).

### 6.4. `ColorStudioPlayground.tsx`
* Laboratorio interactivo para calibrar modelos nuevos antes de publicarlos.
* Carga de cualquier imagen local o presets.
* **Cortina Comparadora Antes/Después**: Deslizador horizontal que permite arrastrar para comparar la mitad original y la mitad recoloreada.
* **Inspector de Píxeles**: Muestra RGB, HSV y Luminancia bajo el cursor en tiempo real.
* **Pruebas de Estrés preconfiguradas**:
  * Botón "Probar Blanco PLA": Evalúa contraste con fondo blanco.
  * Botón "Probar Negro Satinado": Evalúa visibilidad de facetas y biseles.
  * Botón "Probar Blindaje de Mano": Evalúa foto sostenida con dedos.

### 6.5. `ImageZoomLightbox.tsx`
* Modal de inspección fotorrealista a pantalla completa.
* Zoom continuo de `100%` a `400%` con rueda de ratón o controles.
* Paneo por arrastre con ratón para examinar capas de impresión 3D a nivel microscópico.
* Cortina comparadora Antes/Después integrada en el zoom.
* Navegación por teclado (flechas izquierda/derecha) entre las fotos del producto.
* Descarga directa en PNG de alta resolución.
* Apertura de imagen nativa en pestaña nueva.

### 6.6. `ExportModal.tsx`
* Generación de catálogo formal CSV compatible con:
  * **Meta Commerce Manager** (Instagram Shopping & Facebook Shops).
  * **WhatsApp Business Catalog**.
* **Columnas exportadas**:
  `id, title, description, availability, condition, price, link, image_link, brand, google_product_category, color, material`.
* Botón de copiado al portapapeles y botón de descarga de archivo `.csv`.

---

## ☁️ 7. Infraestructura Firebase Firestore (`src/utils/firebase.ts`)
* **Colecciones**:
  * `/catalog_items/{id}`: Documentos de publicaciones unitarias completas.
  * `/base_products/{id}`: Documentos de modelos 3D base.
* **Funciones Exportadas**:
  * `subscribeToCatalog(onSuccess, onError)`: Listener reactivo `onSnapshot`.
  * `saveCatalogBatchToCloud(items)`: Escritura masiva con `writeBatch` particionada en fragmentos de 400 elementos.
  * `toggleStockInCloud(id, inStock)`: Actualización atómica del booleano `inStock`.
  * `deleteCatalogItemFromCloud(id)`: Borrado definitivo de documento.
  * `subscribeToBaseProducts(onSuccess)`: Listener de modelos base.
  * `saveBaseProductToCloud(product)`: Guardado de modelo base.
  * `testFirestoreConnection()`: Prueba con `getDocFromServer` contra `/test/connection`.

---

## 📌 8. Protocolo de Inicio para Nuevos Chats / Sprints
1. Repositorio: `https://github.com/elpepavm/deco3d-catalog.git` (rama `main`).
2. Mensaje inicial para cualquier IA o desarrollador:
   > *"Por favor leé el archivo PROJECT_CONTEXT.md en la raíz del repositorio. Contiene la especificación exhaustiva 100% auditada de Deco 3D Studio (algoritmos matemáticos de colorimetría, 25 filamentos comerciales, estructura de componentes y Firebase). Vamos a continuar sobre esa base para implementar los siguientes requerimientos: [tus requerimientos]"*.
