import { describe, it, expect } from "vitest";
import {
  mapDietaryPreferencesToSpoonacular,
  parseDietaryPreferences,
  parseDietaryPreferencesFromQuery,
  DEFAULT_DIETARY_PREFERENCES,
} from "./dietaryPreferences.js";

describe("parseDietaryPreferences", () => {
  it("defaults empty object", () => {
    expect(parseDietaryPreferences({})).toEqual(DEFAULT_DIETARY_PREFERENCES);
  });

  it("parses known booleans", () => {
    expect(parseDietaryPreferences({ glutenFree: true, vegan: true })).toEqual({
      ...DEFAULT_DIETARY_PREFERENCES,
      glutenFree: true,
      vegan: true,
    });
  });
});

describe("parseDietaryPreferencesFromQuery", () => {
  it("reads 1/true query flags", () => {
    expect(
      parseDietaryPreferencesFromQuery({ dairyFree: "1", nutFree: "true", soyFree: "0" })
    ).toEqual({
      ...DEFAULT_DIETARY_PREFERENCES,
      dairyFree: true,
      nutFree: true,
      soyFree: false,
    });
  });
});

describe("mapDietaryPreferencesToSpoonacular", () => {
  it("builds intolerances and diet strings", () => {
    expect(
      mapDietaryPreferencesToSpoonacular({
        ...DEFAULT_DIETARY_PREFERENCES,
        dairyFree: true,
        glutenFree: true,
        vegetarian: true,
      })
    ).toEqual({
      intolerances: "dairy,gluten",
      diet: "vegetarian",
    });
  });
});
