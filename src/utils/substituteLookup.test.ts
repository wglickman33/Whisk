import { describe, it, expect } from "vitest";
import { substituteFallback } from "../data/substituteFallback";
import { findFallbackSubstitutes } from "./substituteLookup";

describe("substituteFallback data", () => {
  it("includes the expected curated entries from the spec", () => {
    expect(Object.keys(substituteFallback).length).toBeGreaterThanOrEqual(30);
    expect(substituteFallback["balsamic vinegar"]).toEqual([
      "red wine vinegar + a pinch of sugar",
      "apple cider vinegar + a splash of soy sauce",
    ]);
    expect(substituteFallback["cooking sherry"]).toHaveLength(2);
  });

  it("stores every entry as a non-empty string array", () => {
    for (const [key, subs] of Object.entries(substituteFallback)) {
      expect(key.trim().length).toBeGreaterThan(0);
      expect(subs.length).toBeGreaterThan(0);
      for (const sub of subs) {
        expect(typeof sub).toBe("string");
        expect(sub.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("findFallbackSubstitutes", () => {
  it("matches exact keys case-insensitively", () => {
    expect(findFallbackSubstitutes("Balsamic Vinegar")).toEqual(
      substituteFallback["balsamic vinegar"]
    );
  });

  it("matches plurals and substrings", () => {
    const subs = findFallbackSubstitutes("Soy Sauces");
    expect(subs.length).toBeGreaterThan(0);
    expect(subs).toEqual(substituteFallback["soy sauce"]);
  });

  it("returns empty for ingredients with no fallback", () => {
    expect(findFallbackSubstitutes("cucumber")).toEqual([]);
    expect(findFallbackSubstitutes("avocado")).toEqual([]);
    expect(findFallbackSubstitutes("chicken breast")).toEqual([]);
  });

  it("prefers more specific keys over generic substring matches", () => {
    expect(findFallbackSubstitutes("coconut milk (canned, cooking)")).toEqual(
      substituteFallback["coconut milk (canned, cooking)"]
    );
    expect(findFallbackSubstitutes("coconut milk")).toEqual(
      substituteFallback["coconut milk (canned, cooking)"]
    );
    expect(findFallbackSubstitutes("whole milk")).toEqual(substituteFallback["milk"]);
  });

  it("matches parenthetical notes split from the main ingredient name", () => {
    expect(findFallbackSubstitutes("1 garlic clove, minced")).toEqual(
      substituteFallback["garlic clove"]
    );
  });

  it("matches buttermilk before a generic milk substring match", () => {
    expect(findFallbackSubstitutes("buttermilk")).toEqual(substituteFallback["buttermilk"]);
  });

  it("matches egg baking binder key via substring", () => {
    expect(findFallbackSubstitutes("egg (baking, binder)")).toEqual(
      substituteFallback["egg (baking, binder)"]
    );
  });

  it("handles whitespace and extra spacing", () => {
    expect(findFallbackSubstitutes("  balsamic   vinegar  ")).toEqual(
      substituteFallback["balsamic vinegar"]
    );
  });

  it("matches dried herbs key case-insensitively", () => {
    expect(findFallbackSubstitutes("Dried Herbs")).toEqual(
      substituteFallback["dried herbs"]
    );
  });
});
