import { describe, it, expect } from "vitest";
import { QUICK_PICKS } from "./unitPresets";
import { UNIT_CATEGORIES, getUnitsForCategory } from "./unitUtils";

describe("QUICK_PICKS", () => {
  it("defines picks for every category", () => {
    for (const category of UNIT_CATEGORIES) {
      expect(QUICK_PICKS[category].length).toBeGreaterThan(0);
    }
  });

  it("uses valid units for each pick", () => {
    for (const category of UNIT_CATEGORIES) {
      const units = new Set(getUnitsForCategory(category));
      for (const pick of QUICK_PICKS[category]) {
        expect(units.has(pick.from), `${category} from: ${pick.from}`).toBe(true);
        expect(units.has(pick.to), `${category} to: ${pick.to}`).toBe(true);
      }
    }
  });

  it("uses valid default values when provided", () => {
    for (const category of UNIT_CATEGORIES) {
      for (const pick of QUICK_PICKS[category]) {
        if (pick.value !== undefined) {
          expect(Number.isFinite(Number(pick.value))).toBe(true);
        }
      }
    }
  });
});
