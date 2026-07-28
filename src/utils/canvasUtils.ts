export const MAX_CANVAS_DIMENSION = 8192;
export const MAX_CANVAS_PIXELS = 16_777_216; // 4096 × 4096

export interface CanvasDimensionResult {
  ok: boolean;
  width?: number;
  height?: number;
  error?: string;
}

export function getSafeCanvasDimensions(
  width: number,
  height: number
): CanvasDimensionResult {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return { ok: false, error: "Enter valid width and height numbers." };
  }

  const w = Math.round(width);
  const h = Math.round(height);

  if (w < 1 || h < 1) {
    return { ok: false, error: "Width and height must be at least 1 pixel." };
  }

  if (w > MAX_CANVAS_DIMENSION || h > MAX_CANVAS_DIMENSION) {
    return {
      ok: false,
      error: `This photo is too large to process (${w} × ${h}). Try resizing to under ${MAX_CANVAS_DIMENSION} pixels per side.`,
    };
  }

  if (w * h > MAX_CANVAS_PIXELS) {
    return {
      ok: false,
      error: "This photo has too many pixels for your browser to handle safely. Try a smaller image.",
    };
  }

  return { ok: true, width: w, height: h };
}

export function checkImageDimensions(
  width: number,
  height: number
): CanvasDimensionResult {
  return getSafeCanvasDimensions(width, height);
}

export function getOutputMimeType(fileType: string): "image/png" | "image/jpeg" {
  return fileType === "image/png" ? "image/png" : "image/jpeg";
}

export function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not prepare your photo. Try a different file."));
      return;
    }
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not save your photo. Try again."))),
      mimeType,
      quality
    );
  });
}
