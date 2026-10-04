export type ImageType = 'cover' | 'hand' | 'detail' | 'angle' | 'extra';

export interface ProductImage {
  id: string;
  type: ImageType;
  label: string;
  url: string;
  sourceColor?: string; // hex
}

export interface CatalogImageItem {
  id: string;
  label: string;
  url: string;
  type?: ImageType;
}

export interface FilamentColor {
  id: string;
  name: string;
  hex: string;
  category: 'basico' | 'pastel' | 'silk' | 'especial';
  material: 'PLA' | 'PETG' | 'ABS' | 'TPU';
}

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

export interface BaseProduct {
  id: string;
  title: string;
  category: string;
  basePrice: number;
  description: string;
  dimensions: string; // e.g. "15 cm x 7 cm"
  printTime?: string; // e.g. "4 hs"
  skuBase: string;
  images: ProductImage[];
  sourceColorHex: string; // the detected or chosen source color of the 3D print in the base photo
  tolerance: number; // 15-80
  feather: number; // smoothing 0-50
  protectSkin: boolean;
  protectNeutrals: boolean;
}

export interface CatalogItem {
  id: string;
  baseProductId: string;
  variantId: string;
  title: string; // e.g. "DUMMY 13 - Amarillo Sol"
  colorName: string;
  colorHex: string;
  material: string;
  category: string;
  price: number;
  salePrice?: number; // Precio de oferta opcional (ej: para liquidación o promociones)
  sku: string;
  inStock: boolean;
  description: string;
  dimensions: string;
  coverImage: string;
  handImage?: string;
  images: CatalogImageItem[]; // Lista completa de fotos (hasta 10 fotos por producto)
  status?: 'draft' | 'published'; // draft = en revisión (no va a Meta), published = en catálogo activo
  sourceImage?: string; // Foto base original sin teñir (para re-teñir o ajustar en cualquier momento)
  sourceColorHex?: string;
  tolerance?: number;
  feather?: number;
  protectSkin?: boolean;
  protectNeutrals?: boolean;
  createdAt: string;
}

export interface InboxItem {
  id: string;
  title: string;
  category: string;
  basePrice: number;
  skuPrefix: string;
  sourceImage: string;
  sourceHandImage?: string;
  selectedColorIds: string[];
  dimensions: string;
  description: string;
  createdAt: string;
  sourceColorHex?: string;
  tolerance?: number;
  feather?: number;
  protectSkin?: boolean;
  protectNeutrals?: boolean;
}

