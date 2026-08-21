export type RecipePhotoImportLimits = {
  maxSide: number;
  maxBytes: number;
  jpegQuality: number;
  jpegQualityFallback: number;
};

/** Active page limit (Groq free-tier TPM). Keep backend/src/constants/recipePhotoImport.ts in sync. */
export const RECIPE_PHOTO_IMPORT_MAX_COUNT = 2;

/** Raise maxCount to this after Groq TPM upgrade or sequential multi-page reads ship. */
export const RECIPE_PHOTO_IMPORT_PLANNED_MAX_COUNT = 5;

const LIMITS_BY_PAGE_COUNT: Record<number, RecipePhotoImportLimits> = {
  1: { maxSide: 1024, maxBytes: 1_200_000, jpegQuality: 0.82, jpegQualityFallback: 0.65 },
  2: { maxSide: 768, maxBytes: 420_000, jpegQuality: 0.78, jpegQualityFallback: 0.6 },
  // 3-5: add smaller tiers here, or chunked Groq reads, before raising RECIPE_PHOTO_IMPORT_MAX_COUNT.
};

export function getRecipePhotoImportLimits(pageCount: number): RecipePhotoImportLimits {
  const pages = Math.max(1, Math.min(pageCount, RECIPE_PHOTO_IMPORT_MAX_COUNT));
  return LIMITS_BY_PAGE_COUNT[pages] ?? LIMITS_BY_PAGE_COUNT[2]!;
}

/** @deprecated Use getRecipePhotoImportLimits. Kept for callers that only need byte budget. */
export function recipePhotoMaxBytesForCount(pageCount: number): number {
  return getRecipePhotoImportLimits(pageCount).maxBytes;
}

export const RECIPE_PHOTO_MAX_COUNT = RECIPE_PHOTO_IMPORT_MAX_COUNT;
export const RECIPE_PHOTO_MAX_SIDE = LIMITS_BY_PAGE_COUNT[1]!.maxSide;
export const RECIPE_PHOTO_MAX_BYTES = LIMITS_BY_PAGE_COUNT[1]!.maxBytes;
