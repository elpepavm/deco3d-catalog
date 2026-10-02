import { BaseProduct, CatalogItem } from '../types';
import { createDummy13StudioImage, createDummy13HandImage, createPlanterStudioImage, createPlanterHandImage } from './sampleImages';

export function getInitialBaseProducts(): BaseProduct[] {
  const dummyStudioOlive = createDummy13StudioImage('#959b2a');
  const dummyHandOlive = createDummy13HandImage('#959b2a');

  const dummyStudioRed = createDummy13StudioImage('#e11d48');
  const dummyHandRed = createDummy13HandImage('#e11d48');

  const planterStudioBlue = createPlanterStudioImage('#2563eb');
  const planterHandBlue = createPlanterHandImage('#2563eb');

  return [
    {
      id: 'prod-dummy13-oliva',
      title: 'DUMMY 13 - Verde Oliva / Pistacho (Tu Figura)',
      category: 'Figuras Articuladas',
      basePrice: 8500,
      description: 'Figura coleccionable totalmente articulada en filamento Verde Oliva / Pistacho con esqueleto en PETG negro de alta resistencia.',
      dimensions: '14.5 cm de alto',
      printTime: '4.5 hs',
      skuBase: 'DUM13',
      sourceColorHex: '#959b2a',
      tolerance: 45,
      feather: 15,
      protectSkin: true,
      protectNeutrals: true,
      images: [
        {
          id: 'img-d13-oliva-cover',
          type: 'cover',
          label: 'Foto 1: Portada (Estudio)',
          url: dummyStudioOlive,
          sourceColor: '#959b2a',
        },
        {
          id: 'img-d13-oliva-hand',
          type: 'hand',
          label: 'Foto 2: En Mano (Escala)',
          url: dummyHandOlive,
          sourceColor: '#959b2a',
        },
      ],
    },
    {
      id: 'prod-dummy13',
      title: 'DUMMY 13 - Rojo Fuego',
      category: 'Figuras Articuladas',
      basePrice: 8500,
      description: 'Figura coleccionable totalmente articulada impresa en 3D en alta resolución.',
      dimensions: '14.5 cm de alto',
      printTime: '4.5 hs',
      skuBase: 'DUM13',
      sourceColorHex: '#e11d48',
      tolerance: 45,
      feather: 15,
      protectSkin: true,
      protectNeutrals: true,
      images: [
        {
          id: 'img-d13-cover',
          type: 'cover',
          label: 'Foto 1: Portada (Fondo Blanco)',
          url: dummyStudioRed,
          sourceColor: '#e11d48',
        },
        {
          id: 'img-d13-hand',
          type: 'hand',
          label: 'Foto 2: En Mano (Referencia de Escala)',
          url: dummyHandRed,
          sourceColor: '#e11d48',
        },
      ],
    },
    {
      id: 'prod-planter',
      title: 'Maceta Geométrica Facetada Low-Poly',
      category: 'Decoración y Macetas',
      basePrice: 5200,
      description: 'Maceta moderna facetada para suculentas y cactus. Diseño geométrico con orificio de drenaje integrado, impresa en PLA biodegradable.',
      dimensions: '8.5 cm x 9.0 cm',
      printTime: '3.0 hs',
      skuBase: 'MAC-LP',
      sourceColorHex: '#2563eb',
      tolerance: 45,
      feather: 12,
      protectSkin: true,
      protectNeutrals: true,
      images: [
        {
          id: 'img-planter-cover',
          type: 'cover',
          label: 'Foto 1: Portada (Fondo Blanco)',
          url: planterStudioBlue,
          sourceColor: '#2563eb',
        },
        {
          id: 'img-planter-hand',
          type: 'hand',
          label: 'Foto 2: En Mano (Referencia de Escala)',
          url: planterHandBlue,
          sourceColor: '#2563eb',
        },
      ],
    },
  ];
}

export function getInitialCatalogItems(): CatalogItem[] {
  const dummyStudioOlive = createDummy13StudioImage('#959b2a');
  const dummyHandOlive = createDummy13HandImage('#959b2a');

  const dummyStudioRed = createDummy13StudioImage('#e11d48');
  const dummyHandRed = createDummy13HandImage('#e11d48');

  const dummyStudioYellow = createDummy13StudioImage('#eab308');
  const dummyHandYellow = createDummy13HandImage('#eab308');

  const dummyStudioGraphite = createDummy13StudioImage('#2c3038');
  const dummyHandGraphite = createDummy13HandImage('#2c3038');

  const dummyStudioCyan = createDummy13StudioImage('#06b6d4');
  const dummyHandCyan = createDummy13HandImage('#06b6d4');

  const dummyStudioPink = createDummy13StudioImage('#f472b6');
  const dummyHandPink = createDummy13HandImage('#f472b6');

  const planterStudioBlue = createPlanterStudioImage('#2563eb');
  const planterHandBlue = createPlanterHandImage('#2563eb');

  return [
    {
      id: 'item-d13-oliva',
      baseProductId: 'prod-dummy13-oliva',
      variantId: 'v-d13-oliva',
      title: 'DUMMY 13 - Verde Oliva / Pistacho',
      colorName: 'Verde Oliva / Pistacho',
      colorHex: '#959b2a',
      material: 'PLA',
      category: 'Figuras Articuladas',
      price: 8500,
      sku: 'DUM13-OLI',
      inStock: true,
      description: 'Figura Dummy 13 articulada en Verde Oliva satinado con articulaciones negras limpias.',
      dimensions: '14.5 cm de alto',
      coverImage: dummyStudioOlive,
      handImage: dummyHandOlive,
      images: [
        { id: 'img-1', label: '1. Portada (Estudio)', url: dummyStudioOlive, type: 'cover' },
        { id: 'img-2', label: '2. En Mano (Escala)', url: dummyHandOlive, type: 'hand' },
      ],
      createdAt: '2026-10-02',
    },
    {
      id: 'item-d13-rosa',
      baseProductId: 'prod-dummy13-oliva',
      variantId: 'v-d13-rosa',
      title: 'DUMMY 13 - Rosa Pastel',
      colorName: 'Rosa Pastel',
      colorHex: '#f472b6',
      material: 'PLA',
      category: 'Figuras Articuladas',
      price: 8500,
      sku: 'DUM13-ROS',
      inStock: true,
      description: 'Figura Dummy 13 articulada en Rosa Pastel uniforme, con relieve 3D impecable y articulaciones negras.',
      dimensions: '14.5 cm de alto',
      coverImage: dummyStudioPink,
      handImage: dummyHandPink,
      images: [
        { id: 'img-1', label: '1. Portada (Estudio)', url: dummyStudioPink, type: 'cover' },
        { id: 'img-2', label: '2. En Mano (Escala)', url: dummyHandPink, type: 'hand' },
      ],
      createdAt: '2026-10-02',
    },
    {
      id: 'item-d13-grafito',
      baseProductId: 'prod-dummy13-oliva',
      variantId: 'v-d13-grafito',
      title: 'DUMMY 13 - Gris Grafito / Negro PLA',
      colorName: 'Gris Grafito / Negro PLA',
      colorHex: '#2c3038',
      material: 'PLA',
      category: 'Figuras Articuladas',
      price: 8500,
      sku: 'DUM13-GRA',
      inStock: true,
      description: 'Figura Dummy 13 articulada en Gris Grafito satinado con grabado 13 nítido y relieve tridimensional.',
      dimensions: '14.5 cm de alto',
      coverImage: dummyStudioGraphite,
      handImage: dummyHandGraphite,
      images: [
        { id: 'img-1', label: '1. Portada (Estudio)', url: dummyStudioGraphite, type: 'cover' },
        { id: 'img-2', label: '2. En Mano (Escala)', url: dummyHandGraphite, type: 'hand' },
      ],
      createdAt: '2026-10-01',
    },
    {
      id: 'item-d13-aqua',
      baseProductId: 'prod-dummy13-oliva',
      variantId: 'v-d13-aqua',
      title: 'DUMMY 13 - Aqua / Celeste',
      colorName: 'Aqua / Celeste',
      colorHex: '#06b6d4',
      material: 'PLA',
      category: 'Figuras Articuladas',
      price: 8500,
      sku: 'DUM13-AQU',
      inStock: true,
      description: 'Figura Dummy 13 articulada en color Aqua vibrante.',
      dimensions: '14.5 cm de alto',
      coverImage: dummyStudioCyan,
      handImage: dummyHandCyan,
      images: [
        { id: 'img-1', label: '1. Portada (Estudio)', url: dummyStudioCyan, type: 'cover' },
        { id: 'img-2', label: '2. En Mano (Escala)', url: dummyHandCyan, type: 'hand' },
      ],
      createdAt: '2026-10-01',
    },
    {
      id: 'item-d13-amarillo',
      baseProductId: 'prod-dummy13-oliva',
      variantId: 'v-d13-amarillo',
      title: 'DUMMY 13 - Amarillo Sol',
      colorName: 'Amarillo Sol',
      colorHex: '#eab308',
      material: 'PLA',
      price: 8500,
      sku: 'DUM13-AMA',
      category: 'Figuras Articuladas',
      inStock: true,
      description: 'Figura Dummy 13 articulada en color Amarillo Sol brillante.',
      dimensions: '14.5 cm de alto',
      coverImage: dummyStudioYellow,
      handImage: dummyHandYellow,
      images: [
        { id: 'img-1', label: '1. Portada (Estudio)', url: dummyStudioYellow, type: 'cover' },
        { id: 'img-2', label: '2. En Mano (Escala)', url: dummyHandYellow, type: 'hand' },
      ],
      createdAt: '2026-10-01',
    },
    {
      id: 'item-mac-azul',
      baseProductId: 'prod-planter',
      variantId: 'v-mac-azul',
      title: 'Maceta Geométrica - Azul Cobalto',
      colorName: 'Azul Cobalto',
      colorHex: '#2563eb',
      material: 'PLA',
      category: 'Decoración y Macetas',
      price: 5200,
      sku: 'MAC-AZU',
      inStock: true,
      description: 'Maceta geométrica para suculentas en Azul Cobalto satinado.',
      dimensions: '8.5 cm x 9.0 cm',
      coverImage: planterStudioBlue,
      handImage: planterHandBlue,
      images: [
        { id: 'img-1', label: '1. Portada (Estudio)', url: planterStudioBlue, type: 'cover' },
        { id: 'img-2', label: '2. En Mano (Escala)', url: planterHandBlue, type: 'hand' },
      ],
      createdAt: '2026-10-02',
    },
  ];
}
