import { SamModel, AutoProcessor, RawImage, Tensor, env } from '@huggingface/transformers';

// Configurar para usar modelos alojados en HuggingFace CDN
env.allowLocalModels = false;

// Variables de estado del modelo en memoria (Singleton para no recargar)
let samModelPromise: Promise<any> | null = null;
let samProcessorPromise: Promise<any> | null = null;

let cachedImageSrc: string | null = null;
let cachedEmbeddings: any = null;
let cachedInputs: any = null;
let cachedImageDims: { width: number; height: number } | null = null;

export interface AiModelLoadProgress {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress?: number;
  message?: string;
}

type ProgressCallback = (progress: AiModelLoadProgress) => void;

/**
 * Inicializa el modelo SlimSAM en segundo plano (WebAssembly / ONNX en navegador).
 */
export async function initSamModel(onProgress?: ProgressCallback): Promise<boolean> {
  try {
    if (onProgress) onProgress({ status: 'loading', message: 'Cargando IA Segment Anything (15 MB)...' });

    if (!samModelPromise) {
      samModelPromise = SamModel.from_pretrained('Xenova/slimsam-77-uniform', {
        progress_callback: (p: any) => {
          if (p && p.progress && onProgress) {
            onProgress({ 
              status: 'loading', 
              progress: Math.round(p.progress), 
              message: `Descargando IA: ${Math.round(p.progress)}%` 
            });
          }
        },
      });
    }

    if (!samProcessorPromise) {
      samProcessorPromise = AutoProcessor.from_pretrained('Xenova/slimsam-77-uniform');
    }

    await Promise.all([samModelPromise, samProcessorPromise]);

    if (onProgress) onProgress({ status: 'ready', message: 'IA lista. Hacé 1 clic sobre la pieza a teñir.' });
    return true;
  } catch (err: any) {
    console.error('Error al inicializar modelo SAM:', err);
    if (onProgress) onProgress({ status: 'error', message: 'No se pudo cargar el modelo IA en este navegador.' });
    return false;
  }
}

/**
 * Pre-computa los embeddings de la imagen (se hace 1 sola vez por foto, ~1.5s).
 * Luego de esto, cada clic del usuario tarda menos de 50 milisegundos.
 */
export async function prepareImageForAi(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  onProgress?: ProgressCallback
): Promise<boolean> {
  try {
    const isReady = await initSamModel(onProgress);
    if (!isReady) return false;

    // Obtener dimensiones
    const width = imageSource.width;
    const height = imageSource.height;
    cachedImageDims = { width, height };

    // Extraer ImageData
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(imageSource, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);

    const model = await samModelPromise;
    const processor = await samProcessorPromise;

    if (onProgress) onProgress({ status: 'loading', message: 'Analizando geometría y aristas 3D...' });

    const rawImage = new RawImage(imgData.data, width, height, 4);
    cachedInputs = await processor(rawImage);
    cachedEmbeddings = await model.get_image_embeddings(cachedInputs);

    if (onProgress) onProgress({ status: 'ready', message: 'IA lista. Tocá la pieza para teñirla.' });
    return true;
  } catch (err) {
    console.error('Error preparando imagen para IA SAM:', err);
    if (onProgress) onProgress({ status: 'error', message: 'Error procesando imagen con IA.' });
    return false;
  }
}

/**
 * Ejecuta la segmentación por punto:
 * El usuario hace 1 clic en (x, y) de la imagen -> SAM devuelve la máscara perfecta.
 */
export async function segmentAtPoint(
  x: number,
  y: number,
  existingMaskCanvas?: HTMLCanvasElement | null
): Promise<{ maskDataUrl: string; coveragePercentage: number } | null> {
  try {
    if (!cachedEmbeddings || !cachedInputs || !cachedImageDims) {
      console.warn('Embeddings de IA no preparados aún.');
      return null;
    }

    const model = await samModelPromise;
    const processor = await samProcessorPromise;

    const { width, height } = cachedImageDims;

    // Punto normalizado
    const input_points = [[[x, y]]];
    const input_labels = [[1]]; // 1 = Foreground (pieza seleccionada)

    const reshaped = processor.reshape_input_points(
      input_points,
      cachedInputs.original_sizes,
      cachedInputs.reshaped_input_sizes
    );

    const outputs = await model({
      ...cachedEmbeddings,
      input_points: reshaped,
      input_labels: new Tensor('int64', BigInt64Array.from([1n]), [1, 1, 1]),
    });

    const masks = await processor.post_process_masks(
      outputs.pred_masks,
      cachedInputs.original_sizes,
      cachedInputs.reshaped_input_sizes
    );

    if (!masks || masks.length === 0) return null;

    // Seleccionar la mejor máscara según puntaje IoU
    const scores = Array.from(outputs.iou_scores.data as Float32Array);
    let bestIdx = 0;
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] > scores[bestIdx]) bestIdx = i;
    }

    const tensor = masks[0];
    const maskSlice = tensor.slice(null, bestIdx);
    const maskData = maskSlice.data as Uint8Array;

    // Crear canvas con la máscara
    const outCanvas = document.createElement('canvas');
    outCanvas.width = width;
    outCanvas.height = height;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return null;

    // Si ya había una máscara previa (por ejemplo de otra parte de la figura), combinarla
    if (existingMaskCanvas) {
      outCtx.drawImage(existingMaskCanvas, 0, 0, width, height);
    }

    const outImgData = outCtx.getImageData(0, 0, width, height);
    const pixels = outImgData.data;

    let activePixels = 0;
    const totalPixels = width * height;

    for (let i = 0; i < totalPixels; i++) {
      const isSamActive = maskData[i] === 1;
      const pIdx = i * 4;

      if (isSamActive) {
        pixels[pIdx] = 255;
        pixels[pIdx + 1] = 255;
        pixels[pIdx + 2] = 255;
        pixels[pIdx + 3] = 255;
        activePixels++;
      } else if (pixels[pIdx + 3] > 128) {
        activePixels++; // Ya estaba activo en la máscara anterior
      }
    }

    outCtx.putImageData(outImgData, 0, 0);

    return {
      maskDataUrl: outCanvas.toDataURL('image/png'),
      coveragePercentage: Math.round((activePixels / totalPixels) * 100),
    };
  } catch (err) {
    console.error('Error en segmentación SAM por punto:', err);
    return null;
  }
}
