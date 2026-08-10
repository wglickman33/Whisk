import { describe, it, expect } from "vitest";
import {
  applyDietaryFilter,
  createEmptyDietaryPreferences,
  filterSubstitutesByPreferences,
  hasActiveDietaryPreferences,
  mapDietaryPreferencesToSpoonacular,
  parseDietaryPreferences,
} from "./dietaryPreferences";
import type { SubstituteOption } from "../types/dietary";

function opt(
  text: string,
  flags: Partial<Omit<SubstituteOption, "text">> = {}
): SubstituteOption {
  return {
    text,
    dairyFree: flags.dairyFree ?? true,
    glutenFree: flags.glutenFree ?? true,
    nutFree: flags.nutFree ?? true,
    soyFree: flags.soyFree ?? true,
    vegetarian: flags.vegetarian ?? true,
    vegan: flags.vegan ?? true,
    ...(flags.sourcingNote ? { sourcingNote: flags.sourcingNote } : {}),
  };
}

describe("parseDietaryPreferences", () => {
  it("defaults all flags to false", () => {
    expect(parseDietaryPreferences(undefined)).toEqual(createEmptyDietaryPreferences());
    expect(parseDietaryPreferences(null)).toEqual(createEmptyDietaryPreferences());
  });

  it("keeps only known boolean flags", () => {
    expect(
      parseDietaryPreferences({ dairyFree: true, glutenFree: "yes", mystery: true })
    ).toEqual({
      ...createEmptyDietaryPreferences(),
      dairyFree: true,
    });
  });
});

describe("filterSubstitutesByPreferences", () => {
  const cashewCream = opt("cashew cream", { nutFree: false, dairyFree: true, vegan: true });
  const oatMilk = opt("oat milk");
  const greekYogurt = opt("Greek yogurt", { dairyFree: false, vegan: false });

  it("returns all options when no prefs are active", () => {
    expect(
      filterSubstitutesByPreferences([cashewCream, oatMilk], createEmptyDietaryPreferences())
    ).toEqual([cashewCream, oatMilk]);
  });

  it("uses AND logic across active preferences", () => {
    const prefs = {
      ...createEmptyDietaryPreferences(),
      dairyFree: true,
      nutFree: true,
    };
    expect(filterSubstitutesByPreferences([cashewCream, oatMilk, greekYogurt], prefs)).toEqual([
      oatMilk,
    ]);
  });

  it("excludes cashew cream when nut-free is active even if dairy-free passes", () => {
    const prefs = { ...createEmptyDietaryPreferences(), dairyFree: true, nutFree: true };
    expect(filterSubstitutesByPreferences([cashewCream], prefs)).toEqual([]);
  });
});

describe("applyDietaryFilter", () => {
  it("relaxes to unfiltered options when nothing matches", () => {
    const dairyOnly = [opt("milk", { dairyFree: false, vegan: false })];
    const prefs = { ...createEmptyDietaryPreferences(), dairyFree: true };
    const result = applyDietaryFilter(dairyOnly, prefs);
    expect(result.preferencesRelaxed).toBe(true);
    expect(result.options).toEqual(dairyOnly);
  });

  it("does not relax when matches exist", () => {
    const options = [opt("oat milk"), opt("milk", { dairyFree: false, vegan: false })];
    const prefs = { ...createEmptyDietaryPreferences(), dairyFree: true };
    const result = applyDietaryFilter(options, prefs);
    expect(result.preferencesRelaxed).toBe(false);
    expect(result.options.map((o) => o.text)).toEqual(["oat milk"]);
  });
});

describe("mapDietaryPreferencesToSpoonacular", () => {
  it("maps flags to intolerances and diet", () => {
    expect(
      mapDietaryPreferencesToSpoonacular({
        ...createEmptyDietaryPreferences(),
        dairyFree: true,
        nutFree: true,
        vegan: true,
      })
    ).toEqual({
      intolerances: "dairy,peanut,tree nut",
      diet: "vegan",
    });
  });

  it("prefers vegan over vegetarian for diet param", () => {
    expect(
      mapDietaryPreferencesToSpoonacular({
        ...createEmptyDietaryPreferences(),
        vegetarian: true,
        vegan: true,
      }).diet
    ).toBe("vegan");
  });
});

describe("hasActiveDietaryPreferences", () => {
  it("detects any true flag", () => {
    expect(hasActiveDietaryPreferences(createEmptyDietaryPreferences())).toBe(false);
    expect(
      hasActiveDietaryPreferences({ ...createEmptyDietaryPreferences(), soyFree: true })
    ).toBe(true);
  });
});
