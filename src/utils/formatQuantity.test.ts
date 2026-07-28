import { describe, it, expect } from "vitest";
import { formatQuantity } from "./formatQuantity";

describe("formatQuantity", () => {
  it("formats common fractions", () => {
    expect(formatQuantity(0.5)).toBe("½");
    expect(formatQuantity(1.5)).toBe("1 ½");
    expect(formatQuantity(0.25)).toBe("¼");
  });

  it("handles zero and whole numbers", () => {
    expect(formatQuantity(0)).toBe("0");
    expect(formatQuantity(2)).toBe("2");
  });

  it("handles negatives", () => {
    expect(formatQuantity(-0.5)).toBe("-½");
  });
});
