import { describe, it, expect } from "vitest";
import { parseQuantity } from "./parseQuantity";

describe("parseQuantity", () => {
  it("parses empty as zero", () => {
    expect(parseQuantity("")).toBe(0);
    expect(parseQuantity("   ")).toBe(0);
  });

  it("parses decimals and whole numbers", () => {
    expect(parseQuantity("2")).toBe(2);
    expect(parseQuantity("1.5")).toBe(1.5);
    expect(parseQuantity("0.25")).toBe(0.25);
  });

  it("parses common ascii fractions", () => {
    expect(parseQuantity("1/2")).toBe(0.5);
    expect(parseQuantity("1/3")).toBeCloseTo(1 / 3);
    expect(parseQuantity("2/3")).toBeCloseTo(2 / 3);
    expect(parseQuantity("1/4")).toBe(0.25);
    expect(parseQuantity("3/4")).toBe(0.75);
    expect(parseQuantity("1/8")).toBe(0.125);
    expect(parseQuantity("3/8")).toBe(0.375);
  });

  it("parses mixed numbers", () => {
    expect(parseQuantity("1 1/2")).toBe(1.5);
    expect(parseQuantity("2 1/3")).toBeCloseTo(2 + 1 / 3);
    expect(parseQuantity("1 3/4")).toBe(1.75);
  });

  it("parses unicode fractions", () => {
    expect(parseQuantity("½")).toBe(0.5);
    expect(parseQuantity("1 ½")).toBe(1.5);
    expect(parseQuantity("⅛")).toBe(0.125);
  });

  it("returns null for invalid input", () => {
    expect(parseQuantity("abc")).toBeNull();
    expect(parseQuantity("1/0")).toBeNull();
    expect(parseQuantity("1/2/3")).toBeNull();
  });
});
