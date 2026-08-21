import {
  getRecipePhotoImportLimits,
  RECIPE_PHOTO_IMPORT_MAX_COUNT,
  RECIPE_PHOTO_MAX_BYTES,
  RECIPE_PHOTO_MAX_COUNT,
  RECIPE_PHOTO_MAX_SIDE,
  recipePhotoMaxBytesForCount,
  type RecipePhotoImportLimits,
} from "../constants/recipePhotoImport";
import { validateImageForTools } from "./fileSecurity";
import { loadImageElement, canvasToBlob } from "./tools/imageCanvas";

export {
  getRecipePhotoImportLimits,
  RECIPE_PHOTO_IMPORT_MAX_COUNT,
  RECIPE_PHOTO_MAX_BYTES,
  RECIPE_PHOTO_MAX_COUNT,
  RECIPE_PHOTO_MAX_SIDE,
  recipePhotoMaxBytesForCount,
  type RecipePhotoImportLimits,
};

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

export function isCompleteRecipeImport(recipe: {
  title?: string | null;
  description?: string | null;
  tagLabels?: string[];
  ingredients?: { name?: string | null }[];
  steps?: { instruction?: string | null }[];
}): boolean {
  return Boolean(
    recipe.title?.trim() &&
      recipe.description?.trim() &&
      recipe.tagLabels &&
      recipe.tagLabels.some((label) => label.trim()) &&
      recipe.ingredients?.some((item) => item.name?.trim()) &&
      recipe.steps?.some((step) => step.instruction?.trim())
  );
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
  options?: Partial<RecipePhotoImportLimits> & { pageCount?: number }
): Promise<string> {
  const basic = await validateImageForTools(file);
  if (!basic.ok) throw new Error(basic.error ?? "That photo cannot be used.");

  let prepared = file;
  const isHeic =
    /\.(heic|heif)$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif";
  if (isHeic) prepared = await convertHeicToJpeg(file);

  const limits = {
    ...getRecipePhotoImportLimits(options?.pageCount ?? 1),
    ...options,
  };

  const objectUrl = URL.createObjectURL(prepared);
  try {
    const img = await loadImageElement(objectUrl);
    const scale = Math.min(1, limits.maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare that photo. Try a different file.");
    ctx.drawImage(img, 0, 0, width, height);

    let blob = await canvasToBlob(canvas, "image/jpeg", limits.jpegQuality);
    if (blob.size > limits.maxBytes) {
      blob = await canvasToBlob(canvas, "image/jpeg", limits.jpegQualityFallback);
    }
    if (blob.size > limits.maxBytes) {
      throw new Error("That photo is still too large. Try a closer crop.");
    }
    return blobToDataUrl(blob);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
