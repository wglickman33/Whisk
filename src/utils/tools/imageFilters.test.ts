import { describe, it, expect } from "vitest";
import { applyFilter } from "./imageFilters";

describe("applyFilter", () => {
  it("grayscale makes channels equal", () => {
    const data = new ImageData(1, 1);
    data.data[0] = 100;
    data.data[1] = 150;
    data.data[2] = 200;
    data.data[3] = 255;
    const out = applyFilter(data, "grayscale");
    expect(out.data[0]).toBe(out.data[1]);
    expect(out.data[1]).toBe(out.data[2]);
  });
});
