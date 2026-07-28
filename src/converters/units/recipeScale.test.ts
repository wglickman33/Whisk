import { describe, it, expect } from "vitest";
import {
  extractLeadingQuantity,
  scaleIngredientLine,
  scaleRecipeText,
  parseScaleMultiplier,
} from "./recipeScale";

describe("extractLeadingQuantity", () => {
  it("parses decimal quantities", () => {
    expect(extractLeadingQuantity("2 cups flour")).toEqual({
      quantity: 2,
      rest: "cups flour",
    });
  });

  it("parses fractions and mixed numbers", () => {
    expect(extractLeadingQuantity("1/2 tsp salt")).toEqual({
      quantity: 0.5,
      rest: "tsp salt",
    });
    expect(extractLeadingQuantity("1 1/2 cups sugar")).toEqual({
      quantity: 1.5,
      rest: "cups sugar",
    });
  });

  it("returns null when no quantity", () => {
    expect(extractLeadingQuantity("salt to taste")).toBeNull();
    expect(extractLeadingQuantity("")).toBeNull();
  });
});

describe("scaleIngredientLine", () => {
  it("scales numeric ingredient lines", () => {
    expect(scaleIngredientLine("2 cups flour", 2)).toBe("4 cups flour");
    expect(scaleIngredientLine("1/2 tsp salt", 3)).toBe("1 ½ tsp salt");
  });

  it("leaves unparseable lines unchanged", () => {
    expect(scaleIngredientLine("salt to taste", 2)).toBe("salt to taste");
  });

  it("ignores invalid multipliers", () => {
    expect(scaleIngredientLine("2 cups flour", 0)).toBe("2 cups flour");
    expect(scaleIngredientLine("2 cups flour", -1)).toBe("2 cups flour");
  });
});

describe("scaleRecipeText", () => {
  it("scales each line independently", () => {
    const result = scaleRecipeText("2 cups flour\n1/2 tsp salt", 2);
    expect(result).toEqual(["4 cups flour", "1 tsp salt"]);
  });
});

describe("parseScaleMultiplier", () => {
  it("accepts positive numbers and fractions", () => {
    expect(parseScaleMultiplier("2")).toBe(2);
    expect(parseScaleMultiplier("1/2")).toBe(0.5);
  });

  it("rejects invalid multipliers", () => {
    expect(parseScaleMultiplier("")).toBeNull();
    expect(parseScaleMultiplier("0")).toBeNull();
    expect(parseScaleMultiplier("-2")).toBeNull();
  });
});
