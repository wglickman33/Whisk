import { describe, it, expect } from "vitest";
import {
  isRecipePhotoFile,
  RECIPE_PHOTO_MAX_SIDE,
  RECIPE_PHOTO_MAX_COUNT,
  recipePhotoMaxBytesForCount,
  reorderRecipePhotos,
  isCompleteRecipeImport,
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

  it("keeps a phone-sized max dimension", () => {
    expect(RECIPE_PHOTO_MAX_SIDE).toBe(1024);
  });

  it("caps a recipe at five photos", () => {
    expect(RECIPE_PHOTO_MAX_COUNT).toBe(5);
  });

  it("tightens each photo when several are sent together", () => {
    expect(recipePhotoMaxBytesForCount(1)).toBe(1_200_000);
    expect(recipePhotoMaxBytesForCount(5)).toBe(900_000);
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
