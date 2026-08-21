import { describe, it, expect } from "vitest";
import {
  getRecipePhotoImportLimits,
  RECIPE_PHOTO_IMPORT_MAX_COUNT,
  RECIPE_PHOTO_IMPORT_PLANNED_MAX_COUNT,
  RECIPE_PHOTO_MAX_BYTES,
  RECIPE_PHOTO_MAX_COUNT,
  RECIPE_PHOTO_MAX_SIDE,
  recipePhotoMaxBytesForCount,
} from "./recipePhotoImport";

describe("recipePhotoImport constants", () => {
  it("caps active imports at two pages with a planned path to five", () => {
    expect(RECIPE_PHOTO_IMPORT_MAX_COUNT).toBe(2);
    expect(RECIPE_PHOTO_MAX_COUNT).toBe(2);
    expect(RECIPE_PHOTO_IMPORT_PLANNED_MAX_COUNT).toBe(5);
  });

  it("uses full quality for one page and tighter limits for two", () => {
    expect(getRecipePhotoImportLimits(1)).toMatchObject({
      maxSide: 1024,
      maxBytes: 1_200_000,
    });
    expect(getRecipePhotoImportLimits(2)).toMatchObject({
      maxSide: 768,
      maxBytes: 420_000,
    });
    expect(RECIPE_PHOTO_MAX_SIDE).toBe(1024);
    expect(RECIPE_PHOTO_MAX_BYTES).toBe(1_200_000);
    expect(recipePhotoMaxBytesForCount(2)).toBe(420_000);
  });
});
