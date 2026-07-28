import { describe, it, expect } from "vitest";
import { parseUnitInput, formatUnitOutput, formatCopyText, getUnitInputFeedback } from "./unitInput";

describe("parseUnitInput", () => {
  it("parses decimals", () => {
    expect(parseUnitInput("1.5")).toBe(1.5);
    expect(parseUnitInput("-3.25")).toBe(-3.25);
    expect(parseUnitInput("100")).toBe(100);
  });

  it("parses simple fractions", () => {
    expect(parseUnitInput("1/2")).toBe(0.5);
    expect(parseUnitInput("3/4")).toBe(0.75);
    expect(parseUnitInput("-1/4")).toBe(-0.25);
  });

  it("parses mixed numbers", () => {
    expect(parseUnitInput("1 1/2")).toBe(1.5);
    expect(parseUnitInput("2 1/4")).toBe(2.25);
    expect(parseUnitInput("-1 1/2")).toBe(-1.5);
  });

  it("parses unicode fractions", () => {
    expect(parseUnitInput("½")).toBe(0.5);
    expect(parseUnitInput("1½")).toBe(1.5);
    expect(parseUnitInput("1 ½")).toBe(1.5);
    expect(parseUnitInput("¼")).toBe(0.25);
  });

  it("returns null for empty or incomplete input", () => {
    expect(parseUnitInput("")).toBeNull();
    expect(parseUnitInput("   ")).toBeNull();
    expect(parseUnitInput("-")).toBeNull();
    expect(parseUnitInput(".")).toBeNull();
    expect(parseUnitInput("1/")).toBeNull();
    expect(parseUnitInput("abc")).toBeNull();
    expect(parseUnitInput("1 2 3")).toBeNull();
  });

  it("rejects divide by zero", () => {
    expect(parseUnitInput("1/0")).toBeNull();
  });

  it("parses leading-decimal values", () => {
    expect(parseUnitInput(".5")).toBe(0.5);
    expect(parseUnitInput("0.5")).toBe(0.5);
  });
});

describe("getUnitInputFeedback", () => {
  it("reports valid, partial, and invalid states", () => {
    expect(getUnitInputFeedback("")).toBe("empty");
    expect(getUnitInputFeedback("1/2")).toBe("valid");
    expect(getUnitInputFeedback("1/")).toBe("partial");
    expect(getUnitInputFeedback("abc")).toBe("invalid");
  });
});

describe("formatUnitOutput", () => {
  it("formats normal values without trailing zeros", () => {
    expect(formatUnitOutput(236.588)).toBe("236.588");
    expect(formatUnitOutput(2)).toBe("2");
  });

  it("uses scientific notation for extreme magnitudes", () => {
    expect(formatUnitOutput(1e15)).toMatch(/e\+/i);
    expect(formatUnitOutput(0.0000001)).toMatch(/e-/i);
  });
});

describe("formatCopyText", () => {
  it("includes unit label", () => {
    expect(formatCopyText(236.588, "ml")).toBe("236.588 ml");
  });
});
