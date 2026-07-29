import { describe, it, expect } from "vitest";
import {
  recipeToWhiskFile,
  whiskFileToRecipeInput,
  parseWhiskRecipeFile,
  recipeToPlainText,
  WHISK_RECIPE_FORMAT,
  WHISK_RECIPE_VERSION,
} from "./recipeTransfer";
import type { Recipe } from "../api/client";

const sampleRecipe: Recipe = {
  id: "r1",
  title: "Test Pancakes",
  description: "Fluffy breakfast",
  type: "food",
  servings: 4,
  servingUnit: "servings",
  prepTime: 10,
  cookTime: 15,
  notes: "Serve warm",
  sourceUrl: "https://example.com/pancakes",
  unitSystem: "inherit",
  folderId: "f1",
  folder: { id: "f1", name: "Breakfast" },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ingredients: [
    {
      id: "i1",
      name: "flour",
      quantity: 2,
      unit: "cups",
      notes: "sifted",
      isOptional: false,
      order: 0,
    },
    {
      id: "i2",
      name: "vanilla",
      quantity: 1,
      unit: "tsp",
      notes: null,
      isOptional: true,
      order: 1,
    },
  ],
  steps: [
    {
      id: "s1",
      order: 0,
      instruction: "Mix and cook",
      timerMinutes: 5,
      imageUrl: "https://example.com/step.jpg",
    },
  ],
  tags: [
    { tag: { id: "t1", label: "Breakfast", color: "#ffcc00" } },
    { tag: { id: "t2", label: "Vegetarian", color: null } },
  ],
};

describe("recipeTransfer", () => {
  it("exports the whisk json envelope expected by import", () => {
    const file = recipeToWhiskFile(sampleRecipe);
    expect(file.format).toBe(WHISK_RECIPE_FORMAT);
    expect(file.version).toBe(WHISK_RECIPE_VERSION);
    expect(typeof file.exportedAt).toBe("string");
    expect(file.recipe.folderName).toBe("Breakfast");
    expect(file.recipe.tagLabels).toEqual(["Breakfast", "Vegetarian"]);
    expect(file.recipe.steps[0]?.imageUrl).toBe("https://example.com/step.jpg");
  });

  it("round-trips all portable recipe fields through whisk json", () => {
    const file = recipeToWhiskFile(sampleRecipe);
    const parsed = parseWhiskRecipeFile(file);
    const input = whiskFileToRecipeInput(parsed);

    expect(input.title).toBe("Test Pancakes");
    expect(input.description).toBe("Fluffy breakfast");
    expect(input.type).toBe("food");
    expect(input.servings).toBe(4);
    expect(input.servingUnit).toBe("servings");
    expect(input.prepTime).toBe(10);
    expect(input.cookTime).toBe(15);
    expect(input.notes).toBe("Serve warm");
    expect(input.sourceUrl).toBe("https://example.com/pancakes");
    expect(input.unitSystem).toBe("inherit");
    expect(input.ingredients).toEqual([
      {
        name: "flour",
        quantity: 2,
        unit: "cups",
        notes: "sifted",
        isOptional: false,
      },
      {
        name: "vanilla",
        quantity: 1,
        unit: "tsp",
        notes: null,
        isOptional: true,
      },
    ]);
    expect(input.steps).toEqual([
      {
        instruction: "Mix and cook",
        timerMinutes: 5,
        imageUrl: "https://example.com/step.jpg",
      },
    ]);
  });

  it("exports ingredients and steps sorted by their order field", () => {
    const file = recipeToWhiskFile({
      ...sampleRecipe,
      ingredients: [
        { ...sampleRecipe.ingredients[1], order: 1 },
        { ...sampleRecipe.ingredients[0], order: 0 },
      ],
    });
    expect(file.recipe.ingredients.map((ing) => ing.name)).toEqual(["flour", "vanilla"]);
  });

  it("rejects invalid files before import", () => {
    expect(() => parseWhiskRecipeFile({ format: "other" })).toThrow(/not a Whisk recipe/i);
    expect(() => parseWhiskRecipeFile({ format: WHISK_RECIPE_FORMAT, version: 99, recipe: {} })).toThrow(
      /unsupported recipe file version/i
    );
    expect(() =>
      parseWhiskRecipeFile({
        format: WHISK_RECIPE_FORMAT,
        version: WHISK_RECIPE_VERSION,
        recipe: { title: "", servings: 4, ingredients: [], steps: [] },
      })
    ).toThrow(/missing a title/i);
    expect(() =>
      parseWhiskRecipeFile({
        format: WHISK_RECIPE_FORMAT,
        version: WHISK_RECIPE_VERSION,
        recipe: { title: "Soup", servings: 0, ingredients: [], steps: [] },
      })
    ).toThrow(/servings must be between/i);
  });

  it("builds readable plain text", () => {
    const text = recipeToPlainText(sampleRecipe);
    expect(text).toContain("TEST PANCAKES");
    expect(text).toContain("INGREDIENTS");
    expect(text).toContain("2 cups flour");
    expect(text).toContain("INSTRUCTIONS");
    expect(text).toContain("Mix and cook");
  });
});
