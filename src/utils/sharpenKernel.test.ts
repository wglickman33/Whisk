import { describe, it, expect } from "vitest";
import { buildSharpenKernel, applyConvolution } from "./sharpenKernel";

describe("buildSharpenKernel", () => {
  it("sums to 1 at strength 0.5", () => {
    const k = buildSharpenKernel(0.5);
    const sum = k.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});

describe("applyConvolution", () => {
  it("clamps output to 0-255", () => {
    const data = new ImageData(2, 2);
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = 255;
      data.data[i + 1] = 255;
      data.data[i + 2] = 255;
      data.data[i + 3] = 255;
    }
    const kernel = buildSharpenKernel(2);
    const out = applyConvolution(data, kernel, 3);
    for (let i = 0; i < out.data.length; i += 4) {
      expect(out.data[i]).toBeLessThanOrEqual(255);
      expect(out.data[i]).toBeGreaterThanOrEqual(0);
    }
  });
});
