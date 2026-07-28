import { describe, it, expect } from "vitest";
import { validateBarcodeInput } from "./barcodeCore";

describe("validateBarcodeInput", () => {
  it("accepts code128 text", () => {
    expect(validateBarcodeInput("CODE128", "SKU-12345").ok).toBe(true);
  });

  it("validates ean13 digits", () => {
    expect(validateBarcodeInput("EAN13", "5901234123457").ok).toBe(true);
    expect(validateBarcodeInput("EAN13", "abc").ok).toBe(false);
  });

  it("validates upc digits", () => {
    expect(validateBarcodeInput("UPC", "036000291452").ok).toBe(true);
    expect(validateBarcodeInput("UPC", "123").ok).toBe(false);
  });

  it("uppercases code39 input", () => {
    const result = validateBarcodeInput("CODE39", "abc-123");
    expect(result.ok).toBe(true);
    expect(result.value).toBe("ABC-123");
  });
});
