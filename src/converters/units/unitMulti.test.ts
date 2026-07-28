import { describe, it, expect } from "vitest";
import { getMultiConvertRows, getCategoryHint } from "./unitMulti";
import { UNIT_CATEGORIES } from "./unitUtils";

describe("getMultiConvertRows", () => {
  it("returns a row for every unit in the category", () => {
    const rows = getMultiConvertRows(1, "volume", "cup");
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.find((r) => r.unit === "ml")?.value).toBeCloseTo(236.588, 1);
  });

  it("highlights matching from unit value", () => {
    const rows = getMultiConvertRows(5, "weight", "g");
    expect(rows.find((r) => r.unit === "g")?.value).toBe(5);
  });
});

describe("getCategoryHint", () => {
  it("returns a hint for every category", () => {
    for (const category of UNIT_CATEGORIES) {
      expect(getCategoryHint(category).length).toBeGreaterThan(10);
    }
  });
});
