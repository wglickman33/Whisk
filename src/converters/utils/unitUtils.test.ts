import { describe, it, expect } from "vitest";
import { convert } from "../utils/unitUtils";

describe("unitUtils.convert", () => {
  it("converts cups to ml", () => {
    const result = convert(1, "volume", "cup", "ml");
    expect(result).toBeCloseTo(236.588, 1);
  });

  it("converts fahrenheit to celsius", () => {
    const result = convert(32, "temp", "°F", "°C");
    expect(result).toBeCloseTo(0, 1);
  });

  it("returns same value for identical units", () => {
    expect(convert(5, "weight", "g", "g")).toBe(5);
  });

  it("handles zero", () => {
    expect(convert(0, "length", "ft", "m")).toBe(0);
  });
});
