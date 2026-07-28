import { describe, it, expect } from "vitest";
import { shouldMigrateLocalShoppingList } from "./userSync";

describe("shouldMigrateLocalShoppingList", () => {
  it("migrates when server is empty and local has items", () => {
    expect(shouldMigrateLocalShoppingList(3, 0)).toBe(true);
  });

  it("uses server data when server already has items", () => {
    expect(shouldMigrateLocalShoppingList(3, 2)).toBe(false);
  });

  it("does nothing special when both are empty", () => {
    expect(shouldMigrateLocalShoppingList(0, 0)).toBe(false);
  });
});
