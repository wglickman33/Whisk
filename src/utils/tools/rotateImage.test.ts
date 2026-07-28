import { describe, it, expect } from "vitest";
import { getOutputMimeFromFile } from "./rotateImage";

describe("rotateImage", () => {
  it("maps png output mime", () => {
    expect(getOutputMimeFromFile("image/png")).toBe("image/png");
  });

  it("defaults non-png to jpeg", () => {
    expect(getOutputMimeFromFile("image/webp")).toBe("image/jpeg");
  });
});
