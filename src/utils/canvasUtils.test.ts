import { describe, it, expect } from "vitest";
import { getSafeCanvasDimensions, MAX_CANVAS_DIMENSION } from "./canvasUtils";

describe("getSafeCanvasDimensions", () => {
  it("accepts normal dimensions", () => {
    expect(getSafeCanvasDimensions(800, 600).ok).toBe(true);
  });

  it("rejects NaN", () => {
    expect(getSafeCanvasDimensions(NaN, 100).ok).toBe(false);
  });

  it("rejects zero", () => {
    expect(getSafeCanvasDimensions(0, 100).ok).toBe(false);
  });

  it("rejects over max side", () => {
    const result = getSafeCanvasDimensions(MAX_CANVAS_DIMENSION + 1, 100);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });

  it("rejects too many pixels", () => {
    expect(getSafeCanvasDimensions(5000, 5000).ok).toBe(false);
  });
});
