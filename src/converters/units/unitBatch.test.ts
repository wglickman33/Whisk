import { describe, it, expect } from "vitest";
import { parseConversionLine, convertBatchLines } from "./unitBatch";

describe("parseConversionLine", () => {
  it("parses quantity with canonical unit", () => {
    expect(parseConversionLine("2 cup", "volume")).toEqual({
      value: 2,
      fromUnit: "cup",
      remainder: "",
    });
  });

  it("parses plural unit aliases", () => {
    expect(parseConversionLine("2 cups flour", "volume")).toEqual({
      value: 2,
      fromUnit: "cup",
      remainder: "flour",
    });
  });

  it("parses aliases and remainder text", () => {
    expect(parseConversionLine("1/2 tbsp olive oil", "volume")).toEqual({
      value: 0.5,
      fromUnit: "tbsp",
      remainder: "olive oil",
    });
  });

  it("returns null for unparseable lines", () => {
    expect(parseConversionLine("salt", "volume")).toBeNull();
  });
});

describe("convertBatchLines", () => {
  it("converts each line to target unit", () => {
    const rows = convertBatchLines("1 cup\n250 ml", "volume", "ml");
    expect(rows[0].output).toBe("236.588 ml");
    expect(rows[1].output).toBe("250 ml");
  });

  it("reports errors for invalid lines", () => {
    const rows = convertBatchLines("pinch of salt", "volume", "ml");
    expect(rows[0].error).toBeTruthy();
    expect(rows[0].output).toBeNull();
  });
});
