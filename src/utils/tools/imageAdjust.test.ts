import { describe, it, expect } from "vitest";
import { applyAdjustments, clampByte } from "./imageAdjust";

describe("clampByte", () => {
  it("clamps values", () => {
    expect(clampByte(300)).toBe(255);
    expect(clampByte(-5)).toBe(0);
  });
});

describe("applyAdjustments", () => {
  it("preserves alpha", () => {
    const data = new ImageData(1, 1);
    data.data[3] = 200;
    const out = applyAdjustments(data, { brightness: 0, contrast: 0, saturation: 0 });
    expect(out.data[3]).toBe(200);
  });
});
