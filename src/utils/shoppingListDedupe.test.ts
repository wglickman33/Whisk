import { describe, it, expect } from "vitest";
import {
  findDuplicateItemNames,
  filterNonDuplicateItems,
  formatDuplicatePrompt,
  normalizeShoppingItemName,
} from "./shoppingListDedupe";
import type { ShoppingListItem } from "../api/client";

describe("shoppingListDedupe", () => {
  it("normalizes names for comparison", () => {
    expect(normalizeShoppingItemName("  Free Range  EGGS ")).toBe("free range eggs");
  });

  it("finds duplicates among unchecked items only", () => {
    const existing: ShoppingListItem[] = [
      {
        id: "1",
        name: "Eggs",
        checked: false,
        addedByUserId: "u1",
        addedByName: "A",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        name: "eggs",
        checked: true,
        addedByUserId: "u1",
        addedByName: "A",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    expect(findDuplicateItemNames([{ name: "Eggs" }, { name: "Milk" }], existing)).toEqual(["Eggs"]);
  });

  it("filters to non-duplicate incoming items", () => {
    const existing: ShoppingListItem[] = [
      {
        id: "1",
        name: "Eggs",
        checked: false,
        addedByUserId: "u1",
        addedByName: "A",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const incoming = [{ name: "Eggs" }, { name: "Milk" }, { name: "Bread" }];
    expect(filterNonDuplicateItems(incoming, existing).map((row) => row.name)).toEqual([
      "Milk",
      "Bread",
    ]);
  });

  it("formats duplicate prompt copy", () => {
    expect(formatDuplicatePrompt(["Eggs"])).toBe("Eggs is already on the list.");
  });
});
