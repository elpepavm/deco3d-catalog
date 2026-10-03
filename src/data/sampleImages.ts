/**
 * Generador de imágenes de prueba realistas para impresión 3D:
 * 1. Foto en estudio (fondo blanco limpio)
 * 2. Foto sostenida en mano humana adulta (para comparar escala real)
 */

function safeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[] = 0
) {
  try {
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(x, y, w, h, r);
      return;
    }
  } catch {
    // fallback
  }
  ctx.rect(x, y, w, h);
}

export function createDummy13StudioImage(armorColorHex = '#e11d48'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  // Fondo blanco de estudio con leve gradiente suave
  const bgGrad = ctx.createRadialGradient(300, 280, 50, 300, 300, 420);
  bgGrad.addColorStop(0, '#ffffff');
  bgGrad.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 600);

  // Sombra de contacto en la base
  ctx.beginPath();
  ctx.ellipse(300, 520, 110, 22, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
  ctx.fill();

  // --- DUMMY 13: ESQUELETO Y ARTICULACIONES NEGRAS (ABS/PETG NEGRO) ---
  ctx.fillStyle = '#18181b'; // Negro mate
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 2;

  // Cuello
  ctx.fillRect(292, 160, 16, 25);

  // Articulaciones de hombros (esferas negras)
  ctx.beginPath();
  ctx.arc(245, 195, 13, 0, Math.PI * 2);
  ctx.arc(355, 195, 13, 0, Math.PI * 2);
  ctx.fill();

  // Articulaciones de codos
  ctx.beginPath();
  ctx.arc(220, 285, 11, 0, Math.PI * 2);
  ctx.arc(380, 285, 11, 0, Math.PI * 2);
  ctx.fill();

  // Manos/puños negros
  ctx.beginPath();
  ctx.arc(220, 360, 12, 0, Math.PI * 2);
  ctx.arc(380, 360, 12, 0, Math.PI * 2);
  ctx.fill();

  // Pelvis / cintura interior negra
  ctx.fillRect(285, 305, 30, 28);

  // Articulaciones de cadera (esferas negras)
  ctx.beginPath();
  ctx.arc(268, 335, 12, 0, Math.PI * 2);
  ctx.arc(332, 335, 12, 0, Math.PI * 2);
  ctx.fill();

  // Rodillas negras
  ctx.beginPath();
  ctx.arc(264, 420, 11, 0, Math.PI * 2);
  ctx.arc(336, 420, 11, 0, Math.PI * 2);
  ctx.fill();

  // Tobillos negros y suelas
  ctx.fillRect(256, 492, 16, 12);
  ctx.fillRect(328, 492, 16, 12);

  // --- ARMADURA 3D DE COLOR (COLOR BASE DE FILAMENTO) ---
  ctx.fillStyle = armorColorHex;

  // Cabeza con visor facetado
  ctx.beginPath();
  safeRoundRect(ctx, 270, 95, 60, 68, [14, 14, 8, 8]);
  ctx.fill();

  // Visor negro
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  safeRoundRect(ctx, 280, 120, 40, 14, 4);
  ctx.fill();

  // Pechera / Torso superior
  ctx.fillStyle = armorColorHex;
  ctx.beginPath();
  ctx.moveTo(252, 185);
  ctx.lineTo(348, 185);
  ctx.lineTo(336, 255);
  ctx.lineTo(264, 255);
  ctx.closePath();
  ctx.fill();

  // LOGO "13" GRABADO EN RELIEVE EN EL PECHO
  ctx.save();
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Sombra del bajo relieve (hundimiento en el plástico)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillText('13', 300, 218);
  // Brillo del bisel superior
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillText('13', 299, 216);
  ctx.restore();

  // Abdomen
  ctx.fillStyle = armorColorHex;
  ctx.beginPath();
  safeRoundRect(ctx, 274, 260, 52, 42, 6);
  ctx.fill();

  // Placas de hombros
  ctx.beginPath();
  safeRoundRect(ctx, 230, 180, 26, 28, 6);
  safeRoundRect(ctx, 344, 180, 26, 28, 6);
  ctx.fill();

  // Bíceps y antebrazos
  ctx.beginPath();
  safeRoundRect(ctx, 210, 215, 20, 55, 5);
  safeRoundRect(ctx, 370, 215, 20, 55, 5);
  safeRoundRect(ctx, 210, 300, 20, 48, 5);
  safeRoundRect(ctx, 370, 300, 20, 48, 5);
  ctx.fill();

  // Muslos
  ctx.beginPath();
  safeRoundRect(ctx, 252, 345, 26, 65, 6);
  safeRoundRect(ctx, 322, 345, 26, 65, 6);
  ctx.fill();

  // Espinilleras / Pantorrillas
  ctx.beginPath();
  safeRoundRect(ctx, 250, 430, 28, 60, 6);
  safeRoundRect(ctx, 322, 430, 28, 60, 6);
  ctx.fill();

  // Pies
  ctx.beginPath();
  safeRoundRect(ctx, 246, 500, 36, 14, 4);
  safeRoundRect(ctx, 318, 500, 36, 14, 4);
  ctx.fill();

  // Textura sutil de líneas de capa 3D (layer lines)
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  for (let y = 100; y < 510; y += 4) {
    if ((y > 175 && y < 310) || (y > 340 && y < 500)) {
      ctx.beginPath();
      ctx.moveTo(250, y);
      ctx.lineTo(350, y);
      ctx.stroke();
    }
  }

  // Brillo especular plástico
  const shineGrad = ctx.createLinearGradient(250, 180, 350, 300);
  shineGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
  shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = shineGrad;
  ctx.beginPath();
  safeRoundRect(ctx, 274, 190, 25, 60, 4);
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Genera foto con mano humana adulta sosteniendo el Dummy 13.
 */
export function createDummy13HandImage(armorColorHex = '#e11d48'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  // Fondo desenfocado de taller / estudio 3D
  const bgGrad = ctx.createLinearGradient(0, 0, 600, 600);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 600);

  // --- MANO HUMANA: PALMA Y ANTEBRAZO (COLOR PIEL NATURAL) ---
  const skinBase = '#d89b72'; // Tono piel cálido realista
  const skinShadow = '#b87752';
  const skinHighlight = '#eec29f';

  // Palma y antebrazo de fondo
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.moveTo(120, 600);
  ctx.bezierCurveTo(140, 480, 180, 410, 240, 360);
  ctx.bezierCurveTo(280, 330, 360, 330, 440, 370);
  ctx.bezierCurveTo(490, 420, 520, 510, 540, 600);
  ctx.closePath();
  ctx.fill();

  // Sombreado de la palma debajo de la figura
  ctx.fillStyle = skinShadow;
  ctx.beginPath();
  ctx.ellipse(330, 420, 100, 45, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // --- FIGURA DUMMY 13 RECOSTADA / SOSTENIDA EN LA PALMA ---
  // Sombra arrojada por el dummy sobre la palma
  ctx.fillStyle = 'rgba(70, 30, 20, 0.35)';
  ctx.beginPath();
  ctx.ellipse(320, 380, 70, 160, 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Partes negras de Dummy 13
  ctx.fillStyle = '#18181b';
  // Cuello y articulaciones
  ctx.fillRect(302, 175, 14, 20);
  ctx.beginPath();
  ctx.arc(260, 205, 12, 0, Math.PI * 2);
  ctx.arc(360, 205, 12, 0, Math.PI * 2);
  ctx.arc(238, 280, 10, 0, Math.PI * 2);
  ctx.arc(382, 280, 10, 0, Math.PI * 2);
  ctx.fill();
  // Manos y pelvis
  ctx.fillRect(295, 305, 30, 25);
  ctx.beginPath();
  ctx.arc(280, 335, 11, 0, Math.PI * 2);
  ctx.arc(340, 335, 11, 0, Math.PI * 2);
  ctx.arc(278, 410, 10, 0, Math.PI * 2);
  ctx.arc(342, 410, 10, 0, Math.PI * 2);
  ctx.fill();

  // Armadura 3D color base
  ctx.fillStyle = armorColorHex;
  // Cabeza y casco
  ctx.beginPath();
  safeRoundRect(ctx, 280, 120, 58, 62, 10);
  ctx.fill();
  // Visor negro
  ctx.fillStyle = '#09090b';
  ctx.fillRect(290, 145, 38, 12);

  // Torso
  ctx.fillStyle = armorColorHex;
  ctx.beginPath();
  safeRoundRect(ctx, 270, 195, 78, 65, 6);
  ctx.fill();

  // "13" en pecho en la mano
  ctx.save();
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillText('13', 309, 228);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillText('13', 308, 226);
  ctx.restore();

  // Abdomen
  ctx.fillStyle = armorColorHex;
  ctx.fillRect(285, 265, 48, 38);
  // Brazos
  ctx.fillRect(228, 220, 18, 50);
  ctx.fillRect(372, 220, 18, 50);
  ctx.fillRect(228, 295, 18, 45);
  ctx.fillRect(372, 295, 18, 45);
  // Piernas
  ctx.fillRect(268, 345, 24, 60);
  ctx.fillRect(328, 345, 24, 60);
  ctx.fillRect(266, 420, 26, 55);
  ctx.fillRect(328, 420, 26, 55);
  ctx.fillRect(262, 480, 32, 14);
  ctx.fillRect(326, 480, 32, 14);

  // --- DEDOS Y PULGAR POR ENCIMA (SUJETANDO LA FIGURA) ---
  ctx.fillStyle = skinBase;
  ctx.strokeStyle = skinShadow;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(180, 360);
  ctx.bezierCurveTo(200, 310, 240, 295, 275, 310);
  ctx.bezierCurveTo(285, 318, 280, 335, 265, 340);
  ctx.bezierCurveTo(235, 350, 210, 375, 195, 410);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Uña del pulgar
  ctx.fillStyle = skinHighlight;
  ctx.beginPath();
  ctx.ellipse(268, 322, 6, 9, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Dedos de la derecha
  ctx.fillStyle = skinBase;
  // Dedo índice
  ctx.beginPath();
  safeRoundRect(ctx, 385, 240, 75, 32, [16, 8, 8, 16]);
  ctx.fill();
  ctx.stroke();
  // Uña índice
  ctx.fillStyle = skinHighlight;
  ctx.beginPath();
  ctx.ellipse(400, 255, 6, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dedo mayor
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  safeRoundRect(ctx, 385, 285, 85, 34, [16, 8, 8, 16]);
  ctx.fill();
  ctx.stroke();
  // Uña mayor
  ctx.fillStyle = skinHighlight;
  ctx.beginPath();
  ctx.ellipse(400, 302, 6, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Texto
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('✋ Escala: ~14 cm (en mano adulta)', 20, 575);

  return canvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Genera foto de Maceta Geométrica en estudio
 */
export function createPlanterStudioImage(colorHex = '#2563eb'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 600, 600);

  // Sombra base
  ctx.beginPath();
  ctx.ellipse(300, 480, 140, 25, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fill();

  // Facetas geométricas de la maceta 3D
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  ctx.moveTo(210, 240);
  ctx.lineTo(390, 240);
  ctx.lineTo(440, 370);
  ctx.lineTo(360, 470);
  ctx.lineTo(240, 470);
  ctx.lineTo(160, 370);
  ctx.closePath();
  ctx.fill();

  // Facetas sombreadas (bajo relieve)
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.moveTo(210, 240);
  ctx.lineTo(300, 350);
  ctx.lineTo(160, 370);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.moveTo(390, 240);
  ctx.lineTo(300, 350);
  ctx.lineTo(440, 370);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.moveTo(160, 370);
  ctx.lineTo(300, 350);
  ctx.lineTo(240, 470);
  ctx.closePath();
  ctx.fill();

  // Planta suculenta verde arriba
  ctx.fillStyle = '#16a34a';
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.ellipse(300 + Math.cos(angle) * 35, 230 + Math.sin(angle) * 20, 25, 12, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Genera foto de Maceta Geométrica en la mano
 */
export function createPlanterHandImage(colorHex = '#2563eb'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 600, 600);

  // Palma de mano
  const skin = '#d89b72';
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(300, 440, 160, 90, 0, 0, Math.PI * 2);
  ctx.fill();

  // Maceta descansando en la palma
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  ctx.moveTo(220, 220);
  ctx.lineTo(380, 220);
  ctx.lineTo(420, 340);
  ctx.lineTo(350, 430);
  ctx.lineTo(250, 430);
  ctx.lineTo(180, 340);
  ctx.closePath();
  ctx.fill();

  // Facetas 3D
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.moveTo(220, 220);
  ctx.lineTo(300, 320);
  ctx.lineTo(180, 340);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(380, 220);
  ctx.lineTo(300, 320);
  ctx.lineTo(420, 340);
  ctx.closePath();
  ctx.fill();

  // Suculenta
  ctx.fillStyle = '#15803d';
  for (let i = 0; i < 7; i++) {
    const angle = (i * Math.PI) / 3.5;
    ctx.beginPath();
    ctx.ellipse(300 + Math.cos(angle) * 30, 210 + Math.sin(angle) * 16, 20, 10, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pulgar apoyado al frente de la maceta
  ctx.fillStyle = skin;
  ctx.beginPath();
  safeRoundRect(ctx, 170, 350, 65, 30, [15, 8, 8, 15]);
  ctx.fill();

  // Texto
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('✋ Escala: ~8 cm x 9 cm (en palma)', 20, 575);

  return canvas.toDataURL('image/jpeg', 0.82);
}
