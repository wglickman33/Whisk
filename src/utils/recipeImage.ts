import { validateImageForTools } from "./fileSecurity";
import { loadImageElement, canvasToBlob } from "./tools/imageCanvas";

export const RECIPE_PHOTO_MAX_SIDE = 1600;
export const RECIPE_PHOTO_MAX_BYTES = 1_200_000;
export const RECIPE_PHOTO_MAX_COUNT = 5;
const ACCEPTED = new Set(["png", "jpg", "jpeg", "webp", "gif", "heic", "heif", "bmp"]);

export function isRecipePhotoFile(file: File): boolean {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (ACCEPTED.has(ext)) return true;
  return file.type.startsWith("image/");
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const result = blob instanceof Blob ? blob : (blob as Blob[])[0];
  const name = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([result], name, { type: "image/jpeg" });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read that photo."));
    };
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.readAsDataURL(blob);
  });
}

export function recipePhotoMaxBytesForCount(count: number): number {
  const n = Math.max(1, Math.min(count, RECIPE_PHOTO_MAX_COUNT));
  return Math.min(RECIPE_PHOTO_MAX_BYTES, Math.floor(4_500_000 / n));
}

export function reorderRecipePhotos<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export async function prepareRecipePhotoFile(file: File): Promise<File> {
  const basic = await validateImageForTools(file);
  if (!basic.ok) throw new Error(basic.error ?? "That photo cannot be used.");
  const isHeic =
    /\.(heic|heif)$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif";
  if (isHeic) return convertHeicToJpeg(file);
  return file;
}

export async function recipePhotoToDataUrl(
  file: File,
  options?: { maxBytes?: number }
): Promise<string> {
  const basic = await validateImageForTools(file);
  if (!basic.ok) throw new Error(basic.error ?? "That photo cannot be used.");

  let prepared = file;
  const isHeic =
    /\.(heic|heif)$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif";
  if (isHeic) prepared = await convertHeicToJpeg(file);

  const maxBytes = options?.maxBytes ?? RECIPE_PHOTO_MAX_BYTES;
  const objectUrl = URL.createObjectURL(prepared);
  try {
    const img = await loadImageElement(objectUrl);
    const scale = Math.min(1, RECIPE_PHOTO_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare that photo. Try a different file.");
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.82;
    let blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (blob.size > maxBytes) {
      quality = 0.65;
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }
    if (blob.size > maxBytes) {
      throw new Error("That photo is still too large. Try a closer crop.");
    }
    return blobToDataUrl(blob);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
