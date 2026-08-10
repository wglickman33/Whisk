import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPassword,
  isValidUuid,
  validateRecipeBody,
  validateShoppingListItems,
  validateShoppingListItemInput,
  validateBulkShoppingListItems,
  validatePreferences,
  LIMITS,
} from "./validation.js";

describe("isValidEmail", () => {
  it("accepts normal addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("rejects invalid and overlong addresses", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a".repeat(LIMITS.emailMax) + "@x.com")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("accepts passwords within bounds", () => {
    expect(isValidPassword("12345678")).toBe(true);
  });

  it("rejects short passwords", () => {
    expect(isValidPassword("short")).toBe(false);
  });
});

describe("isValidUuid", () => {
  it("accepts v4-style uuids", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects malformed ids", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false);
  });
});

describe("validateRecipeBody", () => {
  it("accepts valid payload shape", () => {
    expect(validateRecipeBody({ title: "Soup", ingredients: [], steps: [] })).toBeNull();
  });

  it("rejects too many ingredients", () => {
    const ingredients = Array.from({ length: LIMITS.maxIngredients + 1 }, () => ({}));
    expect(validateRecipeBody({ ingredients })).toMatch(/ingredients/i);
  });
});

describe("validateShoppingListItems", () => {
  it("accepts valid items", () => {
    expect(
      validateShoppingListItems([{ name: "Milk", quantity: "2 cups" }])
    ).toBeNull();
  });

  it("rejects missing name", () => {
    expect(validateShoppingListItems([{ quantity: "1 cup" }])).toMatch(/name/i);
  });

  it("rejects non-array", () => {
    expect(validateShoppingListItems({})).toMatch(/array/i);
  });

  it("rejects invalid quantity type", () => {
    expect(validateShoppingListItems([{ name: "Eggs", quantity: 2 }])).toMatch(/string/i);
  });

  it("rejects over item limit", () => {
    const items = Array.from({ length: LIMITS.shoppingListMaxItems + 1 }, () => ({
      name: "Item",
    }));
    expect(validateShoppingListItems(items)).toMatch(/too many/i);
  });
});

describe("validateShoppingListItemInput", () => {
  it("accepts a valid item", () => {
    expect(validateShoppingListItemInput({ name: "Milk", quantity: "1 cup" })).toBeNull();
  });

  it("rejects missing name", () => {
    expect(validateShoppingListItemInput({ quantity: "1" })).toMatch(/name/i);
  });
});

describe("validateBulkShoppingListItems", () => {
  it("requires at least one item", () => {
    expect(validateBulkShoppingListItems([])).toMatch(/at least one/i);
  });

  it("accepts valid bulk payload", () => {
    expect(
      validateBulkShoppingListItems([{ name: "Eggs" }, { name: "Milk", note: "whole" }])
    ).toBeNull();
  });
});

describe("validatePreferences", () => {
  it("accepts light theme", () => {
    expect(validatePreferences({ theme: "light" })).toBeNull();
  });

  it("accepts auto theme", () => {
    expect(validatePreferences({ theme: "auto" })).toBeNull();
  });

  it("rejects invalid theme", () => {
    expect(validatePreferences({ theme: "neon" })).toMatch(/theme/i);
  });

  it("rejects invalid unit category", () => {
    expect(validatePreferences({ defaultUnitCategory: "invalid" })).toMatch(/category/i);
  });

  it("accepts dietary preferences object", () => {
    expect(
      validatePreferences({
        dietaryPreferences: { dairyFree: true, vegan: false },
      })
    ).toBeNull();
  });

  it("rejects non-boolean dietary preference flags", () => {
    expect(
      validatePreferences({
        dietaryPreferences: { dairyFree: "yes" },
      })
    ).toMatch(/dairyFree/i);
  });
});
