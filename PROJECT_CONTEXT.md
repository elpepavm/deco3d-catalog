# 📖 PROJECT CONTEXT - DECO 3D STUDIO (ESPECIFICACIÓN EXHAUSTIVA DE PIES A CABEZA)
> **Documento Maestro de Arquitectura, Lógica de Negocio, Componentes y Estado del Sistema.**
> Diseñado para que cualquier desarrollador o nueva sesión de IA pueda continuar el desarrollo con el 100% de la fidelidad sin perder ni un solo detalle.

---

## 📌 1. Visión y Propósito de Negocio
**Deco 3D Studio** es una plataforma SaaS web para fabricantes y talleres de impresión 3D (PLA / PETG).
* **El problema que resuelve**: En la impresión 3D, producir y fotografiar físicamente 15 o 20 colores de cada modelo (ej. Dummy 13, figuras articuladas, macetas, lámparas) requiere cientos de horas de impresión y sesiones fotográficas repetitivas.
* **La solución**: Permite cargar una **única sesión fotográfica real** de un prototipo (hasta 10 fotos por producto: vista frontal, en mano sosteniendo la pieza, detalles de articulaciones, ángulos) y **multiplicar automáticamente todo el catálogo a decenas de colores comerciales**, generando publicaciones unitarias fotorrealistas con SKU propio, precios y fotos en alta resolución listas para e-commerce.

---

## 🏗️ 2. Stack Tecnológico y Configuración de Infraestructura
* **Framework**: React 19.0.1 + Vite 8.3.0 + TypeScript 7.0.2.
* **Estilos**: Tailwind CSS v4.3.3 (`@import "tailwindcss";` nativo).
* **Base de Datos en la Nube**: Google Firebase Firestore.
  * **Database ID**: `ai-studio-deco3dcatlogoyva-0c2a54d4-ed24-442d-891f-f975a5382ec1`.
  * **Configuración**: Archivo `firebase-applet-config.json` en la raíz.
  * **Esquema IR**: `firebase-blueprint.json`.
  * **Reglas de Seguridad**: `firestore.rules` (desplegadas en la nube con acceso de lectura/escritura).
* **Iconografía**: `lucide-react` (iconos SVG limpios y consistentes).
* **Control de Versiones**:
  * **Repositorio**: `https://github.com/elpepavm/deco3d-catalog.git`
  * **Rama Principal**: `main` (con rastreo de upstream configurado).

---

## 🎨 3. Motor Fotorrealista de Colorimetría (`src/utils/recolorEngine.ts`)

Algoritmo matemático de transformación píxel a píxel sobre Canvas 2D en espacio de color RGB, HSV y YCbCr:

### 3.1. Conservación de Iluminación Relativa (`shadeRatio`)
* **Cálculo de Luminancia**: Se calcula la luminancia percibida del píxel mediante la fórmula ITU-R BT.601: `L = 0.299*R + 0.587*G + 0.114*B`.
* **Proporción de Sombra (`shadeRatio`)**: `shadeRatio = pixelLum / baseSampleLum`.
* En lugar de pintar un tinte plano, el color objetivo se escala por `shadeRatio`.
* **Efecto visual**: Mantiene 100% intactas las sombras de oclusión ambiental, las aristas brillantes, las líneas de capa de 0.2mm de la impresora y los brillos especulares.

### 3.2. Calibración Especial: Blanco PLA (`isWhiteTarget`)
* **Problema a evitar**: Quemar la pieza convirtiéndola en una mancha blanca plana que se confunde con el fondo blanco de estudio.
* **Solución algorítmica**:
  * Se aplica un techo elástico de luminancia suave entre `240 y 244` (nunca 255 plano en caras iluminadas).
  * Mantiene las sombras de las facetas en tonos grises suaves (`190 - 220`), permitiendo ver el volumen 3D de la pieza aun sobre fondos blancos.
  * **Descontaminación cromática de bordes (Anti-Halos)**: Detecta píxeles periféricos donde el color de fondo o el color original (ej. Aqua/Cian) rebotan cromáticamente, desaturándolos para eliminar el halo fluorescente en los bordes.

### 3.3. Calibración Especial: Negro Satinado / Carbón PLA (`isBlackTarget`)
* **Problema a evitar**: El "negro empastado" donde la figura se convierte en una silueta oscura sin textura.
* **Solución algorítmica**:
  * Curva no lineal de luminancia:
    * **Sombras profundas y hendiduras**: Valor mínimo controlado en `~24` (nunca negro puro `0`).
    * **Medios tonos de las caras**: Entre `48` y `68`.
    * **Biselados, aristas y reflejos de luz**: Entre `85` y `108`.
  * **Efecto visual**: El plástico se aprecia como filamento negro carbón satinado real, leyendo cada hendidura y volumen de la pieza.

### 3.4. Blindaje Biológico y Estructural (Zonas Protegidas)
1. **Blindaje de Piel Humana (`protectSkin`)**:
   * Algoritmo híbrido HSV + YCbCr calibrado con las cotas antropométricas de piel humana:
     * Matiz $H \in [0°, 50°]$ o $[340°, 360°]$.
     * Saturación $S \in [0.15, 0.75]$.
     * Espacio YCbCr: $Cb \in [77, 127]$ y $Cr \in [133, 173]$.
   * **Propósito**: Si una foto muestra una mano sosteniendo el Dummy 13, los dedos, nudillos y piel humana quedan intactos sin ser teñidos.
2. **Blindaje de Articulaciones y Accesorios Oscuros (`protectJoints`)**:
   * Protege píxeles con saturación muy baja ($S < 0.12$) y baja luminancia ($L < 65$).
   * **Propósito**: En el Dummy 13, el esqueleto interno (bolas de articulación, cuello, encastres) o accesorios como armas negras no cambian de color cuando se modifica la armadura externa.
3. **Cuentagotas de Blindaje Personalizado (`shieldColorHex`)**:
   * Permite muestrear con clic cualquier color específico de la foto que deba quedar 100% inmune.

### 3.5. Parámetros de Ajuste del Motor
* **Tolerancia Angular (`tolerance`)**: Rango de matiz en grados (`0°` a `180°`). Para colores monocromáticos basta `35°-45°`; para espectros amplios con rebotes (como Cyan/Turquesa) se calibra en `70°-95°`.
* **Suavizado de Bordes (`feather`)**: Interpolación suave (`0` a `50`) en las fronteras de selección para evitar serruchos o bordes dentados.
* **Filtros de Luminancia Mínima y Máxima**: Evitan intervenir fondos blancos puros (`> 250`) o sombras oclusivas oscuras (`< 15`).

---

## 🖥️ 4. Anatomía Detallada de Pantallas y Componentes

### 4.1. Barra de Navegación (`src/components/Navbar.tsx`)
* **Logo & Marca**: "Deco 3D Studio" con isotipo 3D y badge de versión.
* **Selector de Pestañas**:
  * 📦 **Catálogo**: Vista de publicaciones unitarias generadas.
  * ⚡ **Multiplicador**: Herramienta de carga de prototipo y generación masiva de variantes.
  * 🎨 **Laboratorio Studio**: Playground interactivo para calibración fina de píxeles.
  * 📤 **Exportar**: Generador de planillas CSV para e-commerce.
* **Contadores en Tiempo Real**: Badge de total de productos y productos en stock.
* **Barra de Estado Cloud**: Indicador superior en vivo de sincronización con Firestore (`🟢 Base de Datos en la Nube Activa`).

### 4.2. Vista de Catálogo (`src/components/CatalogView.tsx`)
* **Barra de Búsqueda y Filtros**:
  * Búsqueda en tiempo real por texto (título, filamento, SKU, categoría).
  * Filtro por categorías mediante chips (`Todos`, `Action Figures`, `Deco & Hogar`, `Macetas`, `Organización`, etc.).
  * Filtro por disponibilidad (`Todos`, `En Stock`, `Sin Stock`).
* **Tarjetas de Publicación Unitaria**:
  * **Carrusel Multifoto**: Navegación por flechas o miniaturas de hasta 10 fotos por producto (Frente, Mano, Detalle, etc.).
  * **Lightbox Zoom**: Al hacer clic en cualquier imagen, se abre el visualizador a pantalla completa.
  * **Chips de Información**:
    * Muestra circular del color de filamento exacto + código HEX.
    * Tipo de material (`PLA`, `PETG`, `ABS`).
    * Dimensiones (`14 x 6 x 3 cm`).
    * Precio formateado en moneda local.
  * **Interacciones Clave**:
    * **Botón Copiar SKU**: Copia el código al portapapeles con confirmación visual (check verde).
    * **Toggle Stock**: Cambia el estado instantáneamente y lo actualiza en Firebase.
    * **Botón WhatsApp Directo**: Genera enlace `https://wa.me/...` con mensaje pre-armado: *"Hola, me interesa el producto [Título] (SKU: [SKU]) en color [Color], precio [Precio]"*.
    * **Eliminar Producto**: Remueve la publicación de la vista y de la base de datos Firestore.

### 4.3. Multiplicador de Variantes (`src/components/VariantMultiplierModal.tsx`)
* **Selector de Modelo Base**: Permite elegir un modelo existente (ej. Dummy 13) o crear uno nuevo cargando fotos desde el disco.
* **Gestor de Fotos del Modelo (hasta 10 fotos)**:
  * Carga drag & drop de imágenes en alta resolución.
  * Etiquetado de cada foto (`Portada / Frente`, `En Mano`, `Detalle / Articulación`, `Perspectiva`, `Base`, etc.).
  * Reordenamiento y previsualización.
* **Panel de Calibración en Vivo**:
  * Muestreo del color original con cuentagotas interactivo sobre el canvas.
  * Controles de tolerancia angular, suavizado (feather) y blindajes.
  * **Previsualización instantánea**: A medida que se mueven los deslizadores, todas las fotos cargadas se muestran coloreadas en tiempo real.
* **Selector de Filamentos Comerciales**:
  * Grilla de más de 20 colores oficiales de fabricantes (Grilon3, Printalot, etc.) categorizados: Básicos, Neón/Vibrantes, Pastel, Metálicos/Seda.
  * Creador de color personalizado: selector de color HEX + nombre del filamento.
* **Generación en Lote**:
  * Multiplica: $N$ filamentos elegidos $\times$ $M$ fotos cargadas.
  * Asigna automáticamente SKUs únicos (ej: `D13-PLA-ROJ-01`, `D13-PLA-BLA-02`).
  * Guarda las publicaciones generadas en lote directamente en Firestore mediante `saveCatalogBatchToCloud`.

### 4.4. Laboratorio de Colorimetría (`src/components/ColorStudioPlayground.tsx`)
* Diseñado para pruebas científicas y calibración de nuevos modelos 3D antes de la multiplicación masiva.
* **Comparador de Cortina Antes/Después**: Deslizador interactivo dividido para comparar la foto original contra la versión transformada.
* **Inspector de Píxeles**: Muestra los valores matemáticos exactos (RGB, HSV, Luminancia) del píxel bajo el cursor.
* **Botones de Prueba Rápida de Estrés**:
  * Prueba de Blanco contra fondo blanco.
  * Prueba de Negro satinado para verificar legibilidad de aristas y biseles.
  * Prueba de preservación de tono de piel.

### 4.5. Visor Modal de Zoom & Inspección (`src/components/ImageZoomLightbox.tsx`)
* **Zoom de Alta Resolución**: Aumento de `100%` hasta `400%` con rueda del ratón o botones `+` / `-`.
* **Paneo por Arrastre**: Permite mover la imagen libremente al hacer zoom para inspeccionar micro-detalles y capas de impresión.
* **Cortina Comparadora Integrada**: Posibilidad de ver el antes/después directamente con zoom aplicado.
* **Navegación**: Flechas de teclado o botones para pasar entre las distintas fotos de la misma publicación.
* **Acciones**:
  * Descargar la foto procesada en PNG de alta resolución.
  * Abrir la imagen en pestaña nueva a tamaño nativo.

### 4.6. Exportación para E-Commerce (`src/components/ExportModal.tsx`)
* Generador de catálogo formal en formato CSV estándar compatible con:
  * **Meta Commerce Manager** (tiendas de Instagram y Facebook Shopping).
  * **Catálogo de WhatsApp Business**.
* **Columnas mapeadas**:
  * `id`: SKU del producto.
  * `title`: Nombre completo con color y especificación.
  * `description`: Medidas, material y detalles de impresión.
  * `availability`: `in stock` o `out of stock`.
  * `condition`: `new`.
  * `price`: Formato numérico en ARS.
  * `image_link`: Enlace o referencia a la imagen principal.
  * `brand`: `Deco 3D Studio`.
  * `color`: Nombre del filamento.
  * `material`: PLA / PETG.
* **Acciones**: Copiar al portapapeles con 1 clic o descargar archivo `.csv`.

---

## 🗄️ 5. Modelos de Datos TypeScript (`src/types.ts`)

```typescript
export type ImageType = 'front' | 'hand' | 'detail' | 'perspective' | 'back' | 'scale';

export interface ProductImage {
  id: string;
  url: string; // Base64 Data URL o link CDN
  label: string; // Ej: "En mano", "Frente"
  type: ImageType;
}

export interface CatalogItem {
  id: string;
  title: string; // Ej: "Dummy 13 Articulado - Rojo Fuego PLA"
  sku: string; // Ej: "D13-PLA-ROJ"
  filamentId: string;
  filamentName: string; // Ej: "Rojo Fuego"
  filamentHex: string; // Ej: "#dc2626"
  material: 'PLA' | 'PETG' | 'ABS' | 'Flex' | 'Resina';
  price: number; // Precio en ARS
  dimensions: string; // Ej: "14 x 6 x 3 cm"
  inStock: boolean;
  category: string; // Ej: "Action Figures"
  images: ProductImage[]; // Hasta 10 fotos unitarias
  createdAt: string; // Fecha ISO
}

export interface BaseProduct {
  id: string;
  title: string;
  category: string;
  basePrice: number;
  sourceColorHex: string; // Color original del prototipo fotografiado
  tolerance: number; // Tolerancia angular de tono (0-180)
  feather: number; // Suavizado de bordes (0-50)
  skuBase: string; // Prefijo SKU (ej: "D13-PLA")
  dimensions: string;
  images: ProductImage[];
}

export interface Filament {
  id: string;
  name: string;
  hex: string;
  category: 'basics' | 'neon' | 'pastel' | 'metallic' | 'custom';
  material: 'PLA' | 'PETG' | 'ABS';
}

export interface RecolorOptions {
  sourceColorHex: string;
  targetColorHex: string;
  tolerance: number; // Grados de tolerancia
  feather: number;
  minLum?: number;
  maxLum?: number;
  protectSkin?: boolean;
  protectJoints?: boolean;
  shieldColorHex?: string;
  shieldTolerance?: number;
}
```

---

## ☁️ 6. Arquitectura de Firebase Firestore (`src/utils/firebase.ts`)
* **Colección `/catalog_items`**: Almacena cada `CatalogItem`.
* **Colección `/base_products`**: Almacena cada `BaseProduct`.
* **Funciones Principales**:
  * `subscribeToCatalog(callback)`: Listener de `onSnapshot` en tiempo real.
  * `saveCatalogBatchToCloud(items)`: Escritura en lotes (`writeBatch`) particionada en fragmentos de hasta 400 documentos (respeta el límite de 500 de Firestore).
  * `toggleStockInCloud(id, inStock)`: Actualización atómica de stock.
  * `deleteCatalogItemFromCloud(id)`: Eliminación en la nube.
  * `testFirestoreConnection()`: Verificación inicial con `getDocFromServer`.

---

## 📌 7. Próximos Pasos & Roadmap Sugerido para Nuevos Sprints
1. **Módulo de Pedidos / Carrito**: Agregar recepción de pedidos directos vía formulario web o WhatsApp con cálculo de costos por gramo de filamento.
2. **Visor 3D STL / 3MF Integrado**: Posibilidad de previsualizar el archivo 3D junto a las fotos de estudio.
3. **Generación con IA Gemini**: Creación automática de descripciones persuasivas optimizadas para Mercado Libre y palabras clave SEO.
4. **Watermarking**: Colocación automática del logo de la marca en una esquina de cada una de las 10 fotos exportadas.
