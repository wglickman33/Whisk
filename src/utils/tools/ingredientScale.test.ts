import { describe, it, expect } from "vitest";
import { scaleByServings, scaleByMultiplier } from "./ingredientScale";

describe("ingredientScale", () => {
  it("scales by servings", () => {
    const result = scaleByServings("2 cups flour\n1/2 tsp salt", "4", "8");
    expect(result.ok).toBe(true);
    expect(result.multiplier).toBe(2);
    expect(result.lines).toEqual(["4 cups flour", "1 tsp salt"]);
  });

  it("scales by multiplier", () => {
    const result = scaleByMultiplier("1 cup sugar", "3");
    expect(result.ok).toBe(true);
    expect(result.lines?.[0]).toBe("3 cup sugar");
  });

  it("rejects invalid servings", () => {
    expect(scaleByServings("1 cup flour", "0", "4").ok).toBe(false);
  });
});
