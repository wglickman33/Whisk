import { describe, it, expect } from "vitest";
import { panYieldFromIds, calculatePanYield, areaScaleFactor } from "./panYield";

describe("panYield", () => {
  it("computes area scale factor", () => {
    expect(areaScaleFactor(100, 200)).toBe(2);
    expect(areaScaleFactor(200, 100)).toBe(0.5);
  });

  it("calculates yield between pans", () => {
    const result = panYieldFromIds("8x8", "9x13");
    expect(result.ok).toBe(true);
    expect(result.factor).toBeGreaterThan(1);
  });

  it("returns same factor for identical areas", () => {
    const result = calculatePanYield(64, 64);
    expect(result.factor).toBe(1);
  });
});
