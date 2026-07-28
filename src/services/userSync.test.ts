import { describe, it, expect, beforeEach } from "vitest";
import {
  readLegacyLocalItems,
  legacyItemToInput,
  shouldMigrateLegacyShoppingList,
} from "./userSync";

describe("readLegacyLocalItems", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns items from persisted zustand storage", () => {
    localStorage.setItem(
      "recipe-app-shopping-list",
      JSON.stringify({ state: { items: [{ name: "Milk", quantity: 2, unit: "cup", notes: null }] } })
    );
    expect(readLegacyLocalItems()).toHaveLength(1);
  });

  it("returns empty array for invalid storage", () => {
    localStorage.setItem("recipe-app-shopping-list", "not-json");
    expect(readLegacyLocalItems()).toEqual([]);
  });
});

describe("legacyItemToInput", () => {
  it("converts legacy numeric quantity to string quantity", () => {
    expect(
      legacyItemToInput({ name: "Eggs", quantity: 6, unit: "", notes: null })
    ).toEqual({
      name: "Eggs",
      quantity: "6",
      note: null,
      category: null,
    });
  });
});

describe("shouldMigrateLegacyShoppingList", () => {
  it("migrates when server has no lists and legacy has items", () => {
    expect(shouldMigrateLegacyShoppingList(2, 0)).toBe(true);
  });

  it("does not migrate when server already has lists", () => {
    expect(shouldMigrateLegacyShoppingList(2, 1)).toBe(false);
  });
});
