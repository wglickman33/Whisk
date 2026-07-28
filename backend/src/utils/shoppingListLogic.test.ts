import { describe, it, expect } from "vitest";
import {
  generateShareCode,
  hasItemPatchFields,
  normalizeJoinCode,
  validateBulkCapacity,
} from "./shoppingListLogic.js";
import { LIMITS } from "./validation.js";

describe("generateShareCode", () => {
  it("returns an 8-character uppercase alphanumeric code", () => {
    const code = generateShareCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z2-9]+$/);
  });
});

describe("normalizeJoinCode", () => {
  it("accepts valid codes", () => {
    expect(normalizeJoinCode(" ab12cd34 ")).toBe("AB12CD34");
  });

  it("rejects short codes", () => {
    expect(normalizeJoinCode("abc")).toBeNull();
    expect(normalizeJoinCode(42)).toBeNull();
  });
});

describe("validateBulkCapacity", () => {
  it("allows additions within limit", () => {
    expect(validateBulkCapacity(10, 5, 500)).toBeNull();
  });

  it("rejects when total would exceed max", () => {
    expect(validateBulkCapacity(LIMITS.shoppingListMaxItems - 1, 2)).toMatch(/too many/i);
  });

  it("rejects zero new items", () => {
    expect(validateBulkCapacity(0, 0)).toMatch(/at least one/i);
  });
});

describe("hasItemPatchFields", () => {
  it("detects patch fields", () => {
    expect(hasItemPatchFields({ checked: true })).toBe(true);
    expect(hasItemPatchFields({})).toBe(false);
  });
});
