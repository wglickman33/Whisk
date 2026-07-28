import { checkImageDimensions, exportCanvasToBlob } from "../canvasUtils";

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load this photo. Try a different file."));
    img.src = src;
  });
}

export async function imageToCanvas(img: HTMLImageElement): Promise<HTMLCanvasElement> {
  const check = checkImageDimensions(img.naturalWidth, img.naturalHeight);
  if (!check.ok) throw new Error(check.error);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare your photo. Try a different file.");
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality = 0.92
): Promise<Blob> {
  return exportCanvasToBlob(canvas, mimeType, quality);
}

export async function processImageFromUrl(
  src: string,
  mimeType: string,
  processor: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void,
  quality = 0.92
): Promise<Blob> {
  const img = await loadImageElement(src);
  const canvas = await imageToCanvas(img);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare your photo. Try a different file.");
  processor(canvas, ctx);
  return canvasToBlob(canvas, mimeType, quality);
}
