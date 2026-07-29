import { describe, it, expect } from "vitest";
import { inferIngredientCategory } from "./inferIngredientCategory";

describe("inferIngredientCategory", () => {
  it.each([
    ["eggplant", "Produce"],
    ["2 large eggs", "Dairy & Eggs"],
    ["peanut butter", "Pantry & Dry Goods"],
    ["cornstarch", "Pantry & Dry Goods"],
    ["corn on the cob", "Produce"],
    ["black pepper", "Spices & Seasonings"],
    ["red bell pepper", "Produce"],
    ["tomato paste", "Canned & Jarred"],
    ["fresh tomato", "Produce"],
    ["garlic powder", "Spices & Seasonings"],
    ["garlic", "Produce"],
    ["cream of tartar", "Pantry & Dry Goods"],
    ["heavy cream", "Dairy & Eggs"],
    ["coconut cream", "Canned & Jarred"],
    ["ice cream", "Frozen"],
    ["mustard greens", "Produce"],
    ["dijon mustard", "Condiments & Sauces"],
    ["frozen broccoli", "Frozen"],
    ["canned tuna", "Canned & Jarred"],
    ["dried thyme", "Spices & Seasonings"],
    ["fresh thyme", "Produce"],
    ["thyme", "Spices & Seasonings"],
    ["almond milk", "Beverages"],
    ["whole milk", "Dairy & Eggs"],
    ["sourdough bread", "Bakery"],
    ["unknown ingredient xyz", null],
    ["", null],
  ] as const)("infers %s as %s", (name, expected) => {
    expect(inferIngredientCategory(name)).toBe(expected);
  });
});
