import { describe, it, expect, beforeEach } from "vitest";
import {
  formatIngredientQuantity,
  groupActiveItemsByCategory,
  itemNameSuggestions,
  sortCategoryLabels,
  ingredientToListItem,
  scaledIngredientToListItem,
  getStoredListId,
  storeListId,
  clearStoredListId,
  SELECTED_LIST_KEY,
  UNCategorized_LABEL,
} from "./shoppingListUtils";

describe("formatIngredientQuantity", () => {
  it("combines quantity and unit", () => {
    expect(formatIngredientQuantity(2, "cups")).toBe("2 cups");
  });

  it("returns null when empty", () => {
    expect(formatIngredientQuantity(0, "")).toBeNull();
  });
});

describe("groupActiveItemsByCategory", () => {
  it("groups unchecked items and skips checked", () => {
    const groups = groupActiveItemsByCategory([
      { id: "1", name: "Milk", category: "Dairy", checked: false },
      { id: "2", name: "Eggs", checked: false },
      { id: "3", name: "Done", checked: true },
    ]);
    expect(groups.get("Dairy")).toHaveLength(1);
    expect(groups.get(UNCategorized_LABEL)).toHaveLength(1);
  });
});

describe("sortCategoryLabels", () => {
  it("puts Other last", () => {
    expect(sortCategoryLabels(["Other", "Produce", "Pantry"])).toEqual([
      "Pantry",
      "Produce",
      "Other",
    ]);
  });
});

describe("itemNameSuggestions", () => {
  it("filters by substring case-insensitively", () => {
    expect(
      itemNameSuggestions(["Chicken thighs", "Chickpeas", "Milk"], "chick")
    ).toEqual(["Chicken thighs", "Chickpeas"]);
  });
});

describe("ingredient conversions", () => {
  it("maps recipe ingredients to list item input", () => {
    expect(
      ingredientToListItem({
        name: " flour ",
        quantity: 2,
        unit: "cups",
        notes: " sifted ",
      })
    ).toEqual({
      name: "flour",
      quantity: "2 cups",
      note: "sifted",
      category: null,
    });
  });

  it("maps scaled ingredients the same way", () => {
    expect(
      scaledIngredientToListItem({
        name: "Sugar",
        quantity: 0.5,
        unit: "cup",
        notes: null,
      })
    ).toEqual({
      name: "Sugar",
      quantity: "½ cup",
      note: null,
      category: null,
    });
  });
});

describe("list selection storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and reads selected list id", () => {
    storeListId("abc");
    expect(getStoredListId()).toBe("abc");
    clearStoredListId();
    expect(getStoredListId()).toBeNull();
  });

  it("uses the expected storage key", () => {
    storeListId("list-1");
    expect(localStorage.getItem(SELECTED_LIST_KEY)).toBe("list-1");
  });
});
