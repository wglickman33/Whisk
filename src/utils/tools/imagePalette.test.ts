import { describe, it, expect } from "vitest";
import { extractPalette } from "./imagePalette";

describe("extractPalette", () => {
  it("returns dominant colors", () => {
    const data = new ImageData(4, 4);
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = 255;
      data.data[i + 1] = 0;
      data.data[i + 2] = 0;
      data.data[i + 3] = 255;
    }
    const palette = extractPalette(data, 3, 1);
    expect(palette.length).toBeGreaterThan(0);
    expect(palette[0].hex.toLowerCase()).toMatch(/^#[0-9a-f]{6}$/);
  });
});
