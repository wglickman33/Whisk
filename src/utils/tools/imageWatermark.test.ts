import { describe, it, expect, vi } from "vitest";
import { drawWatermark } from "./imageWatermark";

describe("drawWatermark", () => {
  it("returns early for blank text", () => {
    const save = vi.fn();
    const ctx = { save } as unknown as CanvasRenderingContext2D;
    drawWatermark(ctx, 200, 100, { text: "  ", opacity: 50, size: 50, position: "center" });
    expect(save).not.toHaveBeenCalled();
  });
});
