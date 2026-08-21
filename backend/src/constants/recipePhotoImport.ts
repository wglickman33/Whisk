/** Active page limit (Groq free-tier TPM). Keep src/constants/recipePhotoImport.ts in sync. */
export const RECIPE_PHOTO_IMPORT_MAX_COUNT = 2;

/** Raise maxCount to this after Groq TPM upgrade or sequential multi-page reads ship. */
export const RECIPE_PHOTO_IMPORT_PLANNED_MAX_COUNT = 5;

/** Per-photo ceiling for decoded uploads (matches the client two-page tier plus headroom). */
export const RECIPE_IMAGE_MAX_BYTES = 520_000;

/** Total payload ceiling for one import request. */
export const RECIPE_IMAGE_MAX_TOTAL_BYTES = 960_000;

export const RECIPE_IMAGE_MAX_COUNT = RECIPE_PHOTO_IMPORT_MAX_COUNT;

/** Enough for a complete recipe JSON without reserving excess Groq TPM. */
export const GROQ_VISION_MAX_COMPLETION_TOKENS = 2048;
