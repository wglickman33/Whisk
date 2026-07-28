import { describe, it, expect } from "vitest";
import { parseCsvLine, parseCsv } from "./csvParser";

describe("parseCsvLine", () => {
  it("parses simple comma-separated values", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("handles quoted fields with commas", () => {
    expect(parseCsvLine('"a,b",c')).toEqual(["a,b", "c"]);
  });

  it("handles escaped quotes inside quoted fields", () => {
    expect(parseCsvLine('"say ""hi""",ok')).toEqual(['say "hi"', "ok"]);
  });
});

describe("parseCsv", () => {
  it("maps headers to row values", () => {
    const rows = parseCsv('name,qty\n"apple, pie",2\nbanana,1');
    expect(rows).toEqual([
      { name: "apple, pie", qty: "2" },
      { name: "banana", qty: "1" },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});
