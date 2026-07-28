import { describe, it, expect } from "vitest";
import { filterRecipes } from "./filterRecipes";
import type { Recipe } from "../api/client";

const sample: Recipe[] = [
  {
    id: "1",
    title: "Tomato Soup",
    description: "Creamy comfort food",
    type: "food",
    servings: 4,
    servingUnit: "servings",
    prepTime: null,
    cookTime: null,
    notes: null,
    sourceUrl: null,
    unitSystem: "inherit",
    folder: { id: "f1", name: "Soups" },
    tags: [{ tag: { id: "t1", label: "comfort", color: null } }],
    createdAt: "",
    updatedAt: "",
    ingredients: [{ id: "i1", name: "tomato", quantity: 2, unit: "", notes: null, isOptional: false, order: 0 }],
    steps: [],
  },
  {
    id: "2",
    title: "Salad",
    description: null,
    type: "food",
    servings: 2,
    servingUnit: "servings",
    prepTime: null,
    cookTime: null,
    notes: null,
    sourceUrl: null,
    unitSystem: "inherit",
    folder: { id: "f2", name: "Sides" },
    tags: [],
    createdAt: "",
    updatedAt: "",
    ingredients: [],
    steps: [],
  },
];

describe("filterRecipes", () => {
  it("returns all recipes when query is empty", () => {
    expect(filterRecipes(sample, "", null)).toHaveLength(2);
  });

  it("filters by ingredient name", () => {
    expect(filterRecipes(sample, "tomato", null)).toHaveLength(1);
  });

  it("filters by description", () => {
    expect(filterRecipes(sample, "comfort", null)).toHaveLength(1);
  });

  it("filters by tag label", () => {
    expect(filterRecipes(sample, "comfort", null)).toHaveLength(1);
  });

  it("is case insensitive", () => {
    expect(filterRecipes(sample, "TOMATO", null)).toHaveLength(1);
  });

  it("filters by folder id", () => {
    expect(filterRecipes(sample, "", "f2")).toHaveLength(1);
    expect(filterRecipes(sample, "", "f2")[0].title).toBe("Salad");
  });

  it("combines folder and search filters", () => {
    expect(filterRecipes(sample, "tomato", "f1")).toHaveLength(1);
    expect(filterRecipes(sample, "tomato", "f2")).toHaveLength(0);
  });

  it("returns empty when nothing matches", () => {
    expect(filterRecipes(sample, "pasta", null)).toHaveLength(0);
  });
});
