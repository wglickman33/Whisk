import { describe, it, expect } from "vitest";
import {
  REFERENCE_PAIRS,
  KITCHEN_QUICK_PICKS,
  SYSTEM_DEFAULTS,
  getSystemDefaults,
  getReferenceTableRows,
  isKitchenCategory,
} from "./unitReference";
import { UNIT_CATEGORIES, getUnitsForCategory, convert } from "./unitUtils";
import { formatUnitOutput } from "./unitInput";

describe("unitReference", () => {
  it("defines reference pairs for every category", () => {
    for (const category of UNIT_CATEGORIES) {
      expect(REFERENCE_PAIRS[category].length).toBeGreaterThan(3);
    }
  });

  it("builds accurate reference table rows", () => {
    const rows = getReferenceTableRows("volume");
    const cupToMl = rows.find((r) => r.fromLabel === "1 cup" && r.toLabel === "ml");
    expect(cupToMl?.value).toBe(formatUnitOutput(convert(1, "volume", "cup", "ml")));
  });

  it("uses valid units in every reference pair", () => {
    for (const category of UNIT_CATEGORIES) {
      const units = new Set(getUnitsForCategory(category));
      for (const pair of REFERENCE_PAIRS[category]) {
        expect(units.has(pair.from), `${category} from ${pair.from}`).toBe(true);
        expect(units.has(pair.to), `${category} to ${pair.to}`).toBe(true);
      }
    }
  });

  it("identifies kitchen categories", () => {
    expect(isKitchenCategory("volume")).toBe(true);
    expect(isKitchenCategory("weight")).toBe(true);
    expect(isKitchenCategory("length")).toBe(false);
  });

  it("uses valid units in system defaults", () => {
    for (const category of ["volume", "weight"] as const) {
      for (const system of ["us", "metric"] as const) {
        const units = new Set(getUnitsForCategory(category));
        const defaults = getSystemDefaults(category, system);
        expect(units.has(defaults.from)).toBe(true);
        expect(units.has(defaults.to)).toBe(true);
        expect(SYSTEM_DEFAULTS[category][system]).toEqual(defaults);
      }
    }
  });

  it("uses valid units in kitchen quick picks", () => {
    for (const category of ["volume", "weight"] as const) {
      const units = new Set(getUnitsForCategory(category));
      for (const pick of KITCHEN_QUICK_PICKS[category]) {
        expect(units.has(pick.from)).toBe(true);
        expect(units.has(pick.to)).toBe(true);
      }
    }
  });
});
