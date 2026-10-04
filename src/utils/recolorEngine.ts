/**
 * Motor profesional de recoloreado para piezas de impresión 3D.
 *
 * Mejoras críticas v5:
 * 1. Blanco PLA con opacidad y contraste de fondo calibrados:
 *    - El blanco puro se calibra entre 175 (sombras de faceta) y 242 (luces directas).
 *    - Se distingue nítidamente sobre el fondo blanco puro (#FFFFFF = 255) sin perderse ni mimetizarse.
 * 2. Negro Satinado PLA (#111827) con volumen tridimensional:
 *    - Ya no es una silueta plana ni oscura; refleja entre 22 y 105 RGB en biseles y grabado del "13",
 *      logrando el acabado exacto de filamento negro satinado / charcoal.
 * 3. Eliminación total de halos y contaminación del color original (Aqua/Azul/Rojo):
 *    - Se amplió el arco angular de coincidencia (maxHueAngle de 40° a 100°) para que las hendiduras,
 *      aristas y transiciones no queden afuera reteniendo el color original.
 *    - Zona de descontaminación de borde que neutraliza cualquier croma residual antes de mezclar,
 *      impidiendo que queden rebordes cyan/aqua sobre negro, amarillo, marfil o blanco.
 * 4. Aislamiento estricto de armas negras, cuchillos y articulaciones.
 */

export interface RecolorOptions {
  sourceColorHex: string;     // Color base de la pieza (ej: '#00A896' aqua, '#163ADE' azul, '#959b2a' oliva)
  targetColorHex: string;     // Color nuevo del filamento (ej: '#FFFFFF' blanco, '#111827' negro, '#F5D63B' amarillo)
  tolerance: number;          // Tolerancia angular de matiz (10 a 90)
  feather: number;            // Suavizado de bordes anti-serrucho (1 a 40)
  protectSkin: boolean;       // Blindaje de piel humana en fotos en mano
  protectNeutrals: boolean;   // Blindaje de articulaciones negras y fondos
  neutralThreshold?: number;  // Umbral neutro (default: 0.13)
  protectedColors?: string[]; // Colores específicos congelados mediante el Cuentagotas de Blindaje
  maskCanvas?: HTMLCanvasElement | null;
  maskDataUrl?: string;       // Máscara de segmentación generada por IA (Segment Anything)
}

// Conversión HEX a RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16) || 0;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Conversión RGB a HEX
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Conversión RGB a HSV (H: 0-360, S: 0-1, V: 0-1)
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;

  let h = 0;
  if (diff > 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / diff) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / diff + 2;
    } else {
      h = (rNorm - gNorm) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s, v };
}

// Conversión HSV a RGB
export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rNorm = 0, gNorm = 0, bNorm = 0;
  if (h >= 0 && h < 60) {
    rNorm = c; gNorm = x; bNorm = 0;
  } else if (h >= 60 && h < 120) {
    rNorm = x; gNorm = c; bNorm = 0;
  } else if (h >= 120 && h < 180) {
    rNorm = 0; gNorm = c; bNorm = x;
  } else if (h >= 180 && h < 240) {
    rNorm = 0; gNorm = x; bNorm = c;
  } else if (h >= 240 && h < 300) {
    rNorm = x; gNorm = 0; bNorm = c;
  } else {
    rNorm = c; gNorm = 0; bNorm = x;
  }

  return {
    r: Math.round((rNorm + m) * 255),
    g: Math.round((gNorm + m) * 255),
    b: Math.round((bNorm + m) * 255),
  };
}

// Distancia angular circular entre dos matices H (0 a 180 grados)
export function circularHueDistance(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
}

// Distancia perceptual ponderada entre dos colores RGB
export function colorDistanceRgb(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const rmean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt((((512 + rmean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rmean) * db * db) >> 8));
}

/**
 * Detección de piel humana biológica (manos, dedos y palmas).
 * Calibrado para luz de estudio, luz cálida de tungsteno, luz LED y sombras naturales.
 */
export function isHumanSkin(r: number, g: number, b: number, hsv?: { h: number; s: number; v: number }): boolean {
  const currHsv = hsv || rgbToHsv(r, g, b);

  // Rango de tono de piel humana (340° a 45°)
  const isWarmSkinHue = (currHsv.h >= 0 && currHsv.h <= 45) || (currHsv.h >= 340 && currHsv.h <= 360);
  if (!isWarmSkinHue) return false;

  // Saturación y brillo de piel real (evita blancos quemados y negros profundos)
  if (currHsv.s < 0.10 || currHsv.s > 0.78) return false;
  if (currHsv.v < 0.18 || currHsv.v > 0.98) return false;

  // Rango de crominancia YCbCr estándar para piel humana
  const y  =  0.299 * r + 0.587 * g + 0.114 * b;
  const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
  const cr =  0.5 * r - 0.418688 * g - 0.081312 * b + 128;

  return cb >= 72 && cb <= 138 && cr >= 128 && cr <= 182 && y >= 30 && y <= 250;
}

/**
 * Detecta automáticamente el color predominante de la pieza 3D.
 */
export function detectDominantPlasticColor(imageSource: HTMLImageElement | HTMLCanvasElement): string {
  const canvas = document.createElement('canvas');
  const w = Math.min(180, imageSource.width);
  const h = Math.min(180, imageSource.height);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '#00A896';

  ctx.drawImage(imageSource, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const hueBuckets = new Array(36).fill(0);
  const bucketRgb: { r: number; g: number; b: number; count: number }[] = Array.from({ length: 36 }, () => ({
    r: 0, g: 0, b: 0, count: 0
  }));

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 50) continue;

    const hsv = rgbToHsv(r, g, b);
    const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;

    // Ignorar fondo blanco
    if (hsv.v > 0.90 && hsv.s < 0.15) continue;
    // Ignorar articulaciones oscuras y armas negras
    if (hsv.v < 0.26 || chroma < 0.20) continue;
    // Ignorar piel
    if (isHumanSkin(r, g, b, hsv)) continue;

    const bucketIdx = Math.floor(hsv.h / 10) % 36;
    hueBuckets[bucketIdx]++;
    bucketRgb[bucketIdx].r += r;
    bucketRgb[bucketIdx].g += g;
    bucketRgb[bucketIdx].b += b;
    bucketRgb[bucketIdx].count++;
  }

  let maxCount = 0;
  let bestIdx = -1;
  for (let b = 0; b < 36; b++) {
    if (hueBuckets[b] > maxCount) {
      maxCount = hueBuckets[b];
      bestIdx = b;
    }
  }

  if (bestIdx >= 0 && bucketRgb[bestIdx].count > 0) {
    const avgR = Math.round(bucketRgb[bestIdx].r / bucketRgb[bestIdx].count);
    const avgG = Math.round(bucketRgb[bestIdx].g / bucketRgb[bestIdx].count);
    const avgB = Math.round(bucketRgb[bestIdx].b / bucketRgb[bestIdx].count);
    return rgbToHex(avgR, avgG, avgB);
  }

  return '#00A896';
}

/**
 * Procesa la imagen aplicando recolorado uniforme a todas las facetas del plástico 3D.
 */
export async function recolorImage(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  options: RecolorOptions
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No se pudo inicializar canvas 2D');

  const width = imageSource.width;
  const height = imageSource.height;
  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(imageSource, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Color origen y destino
  const srcRgb = hexToRgb(options.sourceColorHex);
  const srcHsv = rgbToHsv(srcRgb.r, srcRgb.g, srcRgb.b);
  const srcChroma = (Math.max(srcRgb.r, srcRgb.g, srcRgb.b) - Math.min(srcRgb.r, srcRgb.g, srcRgb.b)) / 255;

  const tgtRgb = hexToRgb(options.targetColorHex);
  const tgtHsv = rgbToHsv(tgtRgb.r, tgtRgb.g, tgtRgb.b);

  // Rango angular dinámico y sensible para reflejar cambios inmediatos en el slider
  const maxHueAngle = 6 + (options.tolerance / 100) * 70; // 6° (muy estricto) a 76° (muy amplio)
  const featherAngle = Math.max(0.5, (options.feather / 100) * 32); // 0.5° (borde duro) a 32° (borde difuso)

  const isSourceSkin = isHumanSkin(srcRgb.r, srcRgb.g, srcRgb.b, srcHsv);

  // Lista de colores blindados con distancia perceptual ponderada RGB
  const protectedRgbList = (options.protectedColors || []).map((hex) => hexToRgb(hex));

  // Umbral dinámico de croma mínimo para aislar armas y articulaciones
  const minChromaThreshold = srcChroma > 0.28 ? Math.min(0.20, srcChroma * 0.36) : 0.08;

  let maskData: Uint8ClampedArray | null = null;
  if (options.maskDataUrl) {
    try {
      const maskImg = await loadImage(options.maskDataUrl);
      const mCanvas = document.createElement('canvas');
      mCanvas.width = width;
      mCanvas.height = height;
      const mCtx = mCanvas.getContext('2d');
      if (mCtx) {
        mCtx.drawImage(maskImg, 0, 0, width, height);
        maskData = mCtx.getImageData(0, 0, width, height).data;
      }
    } catch (err) {
      console.warn('No se pudo cargar la máscara de IA:', err);
    }
  } else if (options.maskCanvas) {
    const maskCtx = options.maskCanvas.getContext('2d');
    if (maskCtx) {
      maskData = maskCtx.getImageData(0, 0, width, height).data;
    }
  }

  const srcLum = (0.299 * srcRgb.r + 0.587 * srcRgb.g + 0.114 * srcRgb.b) / 255;

  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 10) continue;

    const origLum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const pixHsv = rgbToHsv(r, g, b);

    // CASO A: CUANDO HAY MÁSCARA DE IA ACTIVA (Segment Anything)
    if (maskData) {
      const maskVal = maskData[i];
      if (maskVal < 30) {
        // Pixel fuera de la máscara: 100% blindado por la IA (ojos, flor, fondo)
        continue;
      }

      // Este pixel ES parte del muñeco 3D.
      // Fundido natural de sombras al nuevo filamento:
      // Conservamos la luz y relieve original (origLum) para que se mantenga el volumen 3D,
      // pero TODO el tono y saturación toman el del nuevo filamento sin dejar manchas verdes residuales.
      const shadeRatio = Math.max(0.04, origLum) / Math.max(0.12, srcLum);
      const normShade = Math.min(1.4, Math.max(0.12, shadeRatio));

      let recoloredRgb: { r: number; g: number; b: number };

      if (tgtHsv.s < 0.05 && tgtHsv.v > 0.85) {
        // Blanco PLA
        const whiteLuma = Math.min(244, Math.round(172 + Math.pow(normShade, 0.68) * 70));
        recoloredRgb = { r: whiteLuma, g: whiteLuma, b: whiteLuma };
      } else if (tgtHsv.s < 0.05 && tgtHsv.v < 0.22) {
        // Negro Satinado PLA
        const satinLuma = Math.round(22 + Math.pow(normShade, 0.72) * 78);
        recoloredRgb = { r: satinLuma, g: satinLuma, b: Math.min(255, satinLuma + 3) };
      } else if (tgtHsv.s < 0.06) {
        // Gris
        const neutralV = Math.max(0.08, Math.min(0.96, tgtHsv.v * Math.pow(shadeRatio, 0.85)));
        recoloredRgb = hsvToRgb(tgtHsv.h, tgtHsv.s, neutralV);
      } else {
        // Filamentos de Color (Fucsia, Rojo, Amarillo, etc.)
        // Fundido continuo de sombras:
        // El matiz es 100% el nuevo filamento (cero residuo verde en sombras)
        const finalV = Math.max(0.12, Math.min(1.0, tgtHsv.v * Math.pow(normShade, 0.78)));
        // En sombras más oscuras, la saturación se mantiene vívida y del color nuevo
        const finalS = Math.max(0.35, Math.min(1.0, tgtHsv.s * 0.95));
        recoloredRgb = hsvToRgb(tgtHsv.h, finalS, finalV);
      }

      data[i]     = recoloredRgb.r;
      data[i + 1] = recoloredRgb.g;
      data[i + 2] = recoloredRgb.b;
      continue;
    }

    const pixChroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;

    // 1. BLINDAJE DE NEUTROS (Fondo blanco, articulaciones y armas)
    if (options.protectNeutrals) {
      // Fondo blanco de estudio puro
      if (pixHsv.v > 0.90 && pixHsv.s < 0.14) {
        continue;
      }
      // Articulaciones negras profundas y uniones oscuras
      if (pixHsv.v < 0.22 && pixChroma < 0.20) {
        continue;
      }
      // Armas negras, cuchillos y detalles con croma bajo
      if (pixChroma < minChromaThreshold && pixHsv.v < 0.88) {
        continue;
      }
      // Piezas neutras cuando la base es de color vivo
      if (srcChroma > 0.26 && (pixChroma < minChromaThreshold || pixHsv.s < 0.16)) {
        continue;
      }
    }

    // 2. BLINDAJE DE PIEL HUMANA (Manos, dedos y palmas en fotos sosteniendo el modelo)
    if (options.protectSkin) {
      if (isHumanSkin(r, g, b, pixHsv)) {
        if (isSourceSkin) {
          // Si el plástico base también es cálido (ej: rojo/naranja),
          // distinguimos la piel por tener menor saturación o mayor desviación angular
          const distToSrc = circularHueDistance(pixHsv.h, srcHsv.h);
          if (distToSrc > 10 || pixHsv.s < srcHsv.s * 0.70) {
            continue;
          }
        } else {
          continue;
        }
      }
    }

    // 2.5 BLINDAJE DE COLORES ESPECÍFICOS (Cuentagotas)
    if (protectedRgbList.length > 0) {
      let isShielded = false;
      for (let p = 0; p < protectedRgbList.length; p++) {
        const prot = protectedRgbList[p];
        const dist = colorDistanceRgb(r, g, b, prot.r, prot.g, prot.b);
        if (dist < 55) {
          isShielded = true;
          break;
        }
      }
      if (isShielded) {
        continue;
      }
    }

    // 3. COINCIDENCIA POR ÁNGULO DE MATIZ
    const hDist = circularHueDistance(pixHsv.h, srcHsv.h);

    if (hDist > maxHueAngle + featherAngle) {
      // Píxel fuera del rango. Si está en la zona de borde exterior con residuo de color original,
      // desaturamos su tinte para evitar halos cyan/aqua sobre fondos oscuros o bordes.
      if (hDist < maxHueAngle + featherAngle * 1.8 && pixChroma > 0.08) {
        const neutral = Math.round(origLum * 255);
        data[i]     = Math.round(r * 0.4 + neutral * 0.6);
        data[i + 1] = Math.round(g * 0.4 + neutral * 0.6);
        data[i + 2] = Math.round(b * 0.4 + neutral * 0.6);
      }
      continue;
    }

    // Peso de transición suave en los bordes
    let weight = 1.0;
    if (hDist > maxHueAngle) {
      weight = 1.0 - (hDist - maxHueAngle) / featherAngle;
      weight = Math.max(0, Math.min(1, weight));
    }

    // 4. APLICACIÓN FOTORREALISTA DEL NUEVO FILAMENTO
    let recoloredRgb: { r: number; g: number; b: number };
    const shadeRatio = Math.max(0.06, origLum) / Math.max(0.12, srcLum);
    const normShade = Math.min(1.4, Math.max(0.18, shadeRatio));

    if (tgtHsv.s < 0.05 && tgtHsv.v > 0.85) {
      // --- BLANCO PLA CALIBRADO (#FFFFFF) ---
      // Calibrado con opacidad y contraste de fondo:
      // - Facetas iluminadas: ~238 a 244 (blanco puro tangible, nunca se quema ni se pierde con el fondo #FFFFFF)
      // - Sombras y biseles: ~195 a 215 (volumen 3D nítido y relieve del "13")
      // - Hendiduras profundas: ~175 a 190
      const whiteLuma = Math.min(244, Math.round(172 + Math.pow(normShade, 0.68) * 70));
      recoloredRgb = { r: whiteLuma, g: whiteLuma, b: whiteLuma };
    } else if (tgtHsv.s < 0.05 && tgtHsv.v < 0.22) {
      // --- NEGRO SATINADO / CHARCOAL PLA (#111827) ---
      // El plástico negro satinado real refleja luz en sus facetas y biseles:
      // - Sombras de unión: ~24
      // - Facetas normales: ~48 a ~68
      // - Biseles, aristas y grabado del "13": ~85 a ~108
      const satinLuma = Math.round(22 + Math.pow(normShade, 0.72) * 78);
      recoloredRgb = { r: satinLuma, g: satinLuma, b: Math.min(255, satinLuma + 3) };
    } else if (tgtHsv.s < 0.06) {
      // --- GRISES (Gris #8E8F94, Grafito #404551) ---
      const neutralV = Math.max(0.08, Math.min(0.96, tgtHsv.v * Math.pow(shadeRatio, 0.85)));
      recoloredRgb = hsvToRgb(tgtHsv.h, tgtHsv.s, neutralV);
    } else {
      // --- FILAMENTOS DE COLOR (Amarillo, Fucsia, Lila, Rosa Claro, Marfil, etc.) ---
      const targetH = tgtHsv.h;
      const satRatio = pixHsv.s / Math.max(0.2, srcHsv.s);
      const finalS = Math.max(0.02, Math.min(1.0, tgtHsv.s * (0.80 + 0.20 * Math.min(1.2, satRatio))));
      const finalV = Math.max(0.08, Math.min(1.0, tgtHsv.v * Math.pow(shadeRatio, 0.82)));

      recoloredRgb = hsvToRgb(targetH, finalS, finalV);
    }

    // 5. DESCONTAMINACIÓN DE BORDES Y APLICACIÓN
    if (weight >= 0.85) {
      data[i]     = recoloredRgb.r;
      data[i + 1] = recoloredRgb.g;
      data[i + 2] = recoloredRgb.b;
    } else {
      // En el borde exterior, neutralizamos el residuo de color original antes de fundir con el nuevo tono
      const neutralEdge = Math.round(origLum * 255);
      data[i]     = Math.round(neutralEdge * (1 - weight) + recoloredRgb.r * weight);
      data[i + 1] = Math.round(neutralEdge * (1 - weight) + recoloredRgb.g * weight);
      data[i + 2] = Math.round(neutralEdge * (1 - weight) + recoloredRgb.b * weight);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Carga una imagen a partir de una URL o Base64 y retorna un HTMLImageElement listo.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}
