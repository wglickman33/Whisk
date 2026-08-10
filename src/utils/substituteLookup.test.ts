import { describe, it, expect } from "vitest";
import { substituteFallback } from "../data/substituteFallback";
import { findFallbackSubstitutes } from "./substituteLookup";
import { DIETARY_PREFERENCE_KEYS } from "../types/dietary";
import {
  applyDietaryFilter,
  createEmptyDietaryPreferences,
  filterSubstitutesByPreferences,
} from "./dietaryPreferences";

describe("substituteFallback data", () => {
  it("includes the expected curated entries from the spec", () => {
    expect(Object.keys(substituteFallback).length).toBeGreaterThanOrEqual(30);
    expect(substituteFallback["balsamic vinegar"].map((s) => s.text)).toEqual([
      "red wine vinegar + a pinch of sugar",
      "apple cider vinegar + a splash of soy sauce",
    ]);
    expect(substituteFallback["cooking sherry"]).toHaveLength(3);
  });

  it("stores every entry as SubstituteOption objects with boolean flags", () => {
    for (const [key, subs] of Object.entries(substituteFallback)) {
      expect(key.trim().length).toBeGreaterThan(0);
      expect(subs.length).toBeGreaterThan(0);
      for (const sub of subs) {
        expect(typeof sub.text).toBe("string");
        expect(sub.text.trim().length).toBeGreaterThan(0);
        for (const flag of DIETARY_PREFERENCE_KEYS) {
          expect(typeof sub[flag]).toBe("boolean");
        }
      }
    }
  });

  it("tags dairy-to-dairy substitutes as not dairy-free", () => {
    const yogurtOption = substituteFallback.buttermilk.find((s) =>
      s.text.includes("yogurt thinned")
    );
    expect(yogurtOption?.dairyFree).toBe(false);
    expect(yogurtOption?.vegan).toBe(false);
  });

  it("includes a dairy-free nut-free heavy cream option", () => {
    const coconut = substituteFallback["heavy cream"].find((s) =>
      s.text.toLowerCase().includes("coconut")
    );
    expect(coconut).toBeTruthy();
    expect(coconut?.dairyFree).toBe(true);
    expect(coconut?.nutFree).toBe(true);
  });

  it("tags nut-based substitutes as not nut-free", () => {
    const walnut = substituteFallback["sesame oil"].find((s) =>
      s.text.toLowerCase().includes("walnut")
    );
    expect(walnut?.nutFree).toBe(false);
  });

  it("spot-checks tags across dairy, baking, protein, and condiment entries", () => {
    const buttermilkDairy = substituteFallback.buttermilk.find((s) =>
      s.text.includes("yogurt thinned")
    );
    expect(buttermilkDairy).toMatchObject({ dairyFree: false, vegan: false });

    const flourThickener = substituteFallback.cornstarch.find((s) =>
      s.text.toLowerCase().includes("all-purpose flour")
    );
    expect(flourThickener?.glutenFree).toBe(false);

    const margarine = substituteFallback["butter (baking)"].find((s) =>
      s.text.toLowerCase().includes("margarine")
    );
    expect(margarine).toMatchObject({
      dairyFree: false,
      vegan: false,
    });
    expect(margarine?.sourcingNote).toBeTruthy();

    const tamari = substituteFallback["soy sauce"].find((s) =>
      s.text.toLowerCase().includes("tamari")
    );
    expect(tamari?.soyFree).toBe(false);

    const almond = substituteFallback["vanilla extract"].find((s) =>
      s.text.toLowerCase().includes("almond")
    );
    expect(almond?.nutFree).toBe(false);

    const veganMayo = substituteFallback.mayonnaise.find((s) =>
      s.text.toLowerCase().includes("vegan mayonnaise")
    );
    expect(veganMayo).toMatchObject({ vegan: true, vegetarian: true, dairyFree: true });

    const honeySub = substituteFallback.molasses.find((s) => s.text.toLowerCase().includes("honey"));
    expect(honeySub?.vegan).toBe(false);

    const beefLentilWalnut = substituteFallback["ground beef"].find((s) =>
      s.text.toLowerCase().includes("walnut")
    );
    expect(beefLentilWalnut).toMatchObject({
      nutFree: false,
      vegetarian: true,
      vegan: true,
      dairyFree: true,
    });

    const worcestershire = substituteFallback["worcestershire sauce"][0];
    expect(worcestershire).toMatchObject({
      soyFree: false,
      vegetarian: false,
      vegan: false,
    });
    expect(worcestershire.sourcingNote).toBeTruthy();
  });

  it("excludes nut-based vegetarian beef sub when nut-free AND dairy-free are active", () => {
    const prefs = {
      ...createEmptyDietaryPreferences(),
      dairyFree: true,
      nutFree: true,
      vegetarian: true,
    };
    const filtered = filterSubstitutesByPreferences(substituteFallback["ground beef"], prefs);
    const texts = filtered.map((s) => s.text.toLowerCase());
    expect(texts.some((t) => t.includes("walnut"))).toBe(false);
    expect(texts.some((t) => t.includes("mushroom"))).toBe(true);
    expect(texts.some((t) => t.includes("turkey") || t.includes("chicken"))).toBe(false);
  });

  it("still filters correctly with all six preferences active", () => {
    const prefs = {
      dairyFree: true,
      glutenFree: true,
      nutFree: true,
      soyFree: true,
      vegetarian: true,
      vegan: true,
    };
    const { options, preferencesRelaxed } = applyDietaryFilter(
      substituteFallback["ground beef"],
      prefs
    );
    expect(preferencesRelaxed).toBe(false);
    expect(options.map((s) => s.text)).toEqual([
      "cooked brown lentils + mushrooms, pulsed (vegetarian, nut-free approximation)",
    ]);
  });

  it("keeps sourcingNote on options that survive filtering", () => {
    const prefs = { ...createEmptyDietaryPreferences(), dairyFree: true };
    const { options } = applyDietaryFilter(substituteFallback["butter (baking)"], prefs);
    expect(options.some((o) => o.text.toLowerCase().includes("margarine"))).toBe(false);
    expect(options.some((o) => o.text.toLowerCase().includes("vegetable oil"))).toBe(true);
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

  it("matches plural form with trailing whitespace via stripPlural", () => {
    expect(findFallbackSubstitutes("Heavy Creams ")).toEqual(
      substituteFallback["heavy cream"]
    );
  });

  it("matches dried herbs key case-insensitively", () => {
    expect(findFallbackSubstitutes("Dried Herbs")).toEqual(
      substituteFallback["dried herbs"]
    );
  });
});
