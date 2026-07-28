import { describe, it, expect } from "vitest";
import { csvToJson, jsonToCsv, validateCsv, formatCsvPreview } from "./csvFormat";

describe("csvFormat", () => {
  it("validates csv", () => {
    const result = validateCsv("name,qty\napple,2");
    expect(result.ok).toBe(true);
    expect(result.output).toContain("2 columns");
  });

  it("converts csv to json", () => {
    const result = csvToJson('name,qty\n"apple, pie",2');
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.output!)).toEqual([{ name: "apple, pie", qty: "2" }]);
  });

  it("converts json to csv", () => {
    const result = jsonToCsv('[{"name":"apple","qty":2}]');
    expect(result.ok).toBe(true);
    expect(result.output).toContain("name,qty");
    expect(result.output).toContain("apple,2");
  });

  it("previews csv as aligned columns", () => {
    const result = formatCsvPreview("name,qty\napple,2");
    expect(result.ok).toBe(true);
    expect(result.output).toContain("name");
    expect(result.output).toContain("apple");
  });
});
