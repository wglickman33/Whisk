import { describe, it, expect } from "vitest";
import {
  isRecipePhotoFile,
  getRecipePhotoImportLimits,
  reorderRecipePhotos,
  isCompleteRecipeImport,
  RECIPE_PHOTO_MAX_COUNT,
} from "./recipeImage";

describe("isRecipePhotoFile", () => {
  it("accepts common photo types", () => {
    expect(isRecipePhotoFile(new File([""], "card.jpg", { type: "image/jpeg" }))).toBe(true);
    expect(isRecipePhotoFile(new File([""], "page.HEIC", { type: "image/heic" }))).toBe(true);
    expect(isRecipePhotoFile(new File([""], "scan.png", { type: "image/png" }))).toBe(true);
  });

  it("rejects non-images", () => {
    expect(isRecipePhotoFile(new File([""], "notes.pdf", { type: "application/pdf" }))).toBe(false);
    expect(isRecipePhotoFile(new File([""], "recipe.json", { type: "application/json" }))).toBe(false);
  });

  it("caps a recipe at two pages for now", () => {
    expect(RECIPE_PHOTO_MAX_COUNT).toBe(2);
  });

  it("tightens compression when two pages are staged", () => {
    expect(getRecipePhotoImportLimits(1).maxSide).toBe(1024);
    expect(getRecipePhotoImportLimits(2).maxSide).toBe(768);
    expect(getRecipePhotoImportLimits(2).maxBytes).toBeLessThan(getRecipePhotoImportLimits(1).maxBytes);
  });

  it("reorders pages without dropping any", () => {
    expect(reorderRecipePhotos(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(reorderRecipePhotos(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(reorderRecipePhotos(["a", "b"], 0, 3)).toEqual(["a", "b"]);
  });
});

describe("isCompleteRecipeImport", () => {
  it("requires name, description, tags, ingredients, and instructions", () => {
    const complete = {
      title: "Pancakes",
      description: "Fluffy breakfast cakes.",
      tagLabels: ["Sweet", "Dessert"],
      ingredients: [{ name: "flour" }],
      steps: [{ instruction: "Mix and cook." }],
    };
    expect(isCompleteRecipeImport(complete)).toBe(true);
    expect(isCompleteRecipeImport({ ...complete, title: " " })).toBe(false);
    expect(isCompleteRecipeImport({ ...complete, description: "" })).toBe(false);
    expect(isCompleteRecipeImport({ ...complete, tagLabels: [] })).toBe(false);
    expect(isCompleteRecipeImport({ ...complete, ingredients: [{ name: "" }] })).toBe(false);
    expect(isCompleteRecipeImport({ ...complete, steps: [{ instruction: "" }] })).toBe(false);
  });
});
