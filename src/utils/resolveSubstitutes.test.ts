import { describe, it, expect, vi } from "vitest";
import { resolveSubstitutes } from "./resolveSubstitutes";
import { createEmptyDietaryPreferences } from "./dietaryPreferences";
import type { SubstituteOption } from "../types/dietary";

function opt(text: string, flags: Partial<Omit<SubstituteOption, "text">> = {}): SubstituteOption {
  return {
    text,
    dairyFree: flags.dairyFree ?? true,
    glutenFree: flags.glutenFree ?? true,
    nutFree: flags.nutFree ?? true,
    soyFree: flags.soyFree ?? true,
    vegetarian: flags.vegetarian ?? true,
    vegan: flags.vegan ?? true,
  };
}

describe("resolveSubstitutes", () => {
  it("returns API results when the API has substitutes", async () => {
    const fetchApi = vi.fn().mockResolvedValue(["Greek yogurt", "crème fraîche"]);
    const findFallback = vi.fn().mockReturnValue([opt("fallback only")]);

    const result = await resolveSubstitutes("sour cream", fetchApi, findFallback);

    expect(result.source).toBe("api");
    expect(result.noSubstitute).toBe(false);
    expect(result.preferencesRelaxed).toBe(false);
    expect(result.substitutes.map((s) => s.text)).toEqual(["Greek yogurt", "crème fraîche"]);
    expect(findFallback).not.toHaveBeenCalled();
  });

  it("uses fallback when the API returns empty", async () => {
    const fetchApi = vi.fn().mockResolvedValue([]);
    const findFallback = vi.fn().mockReturnValue([opt("tamari (1:1, gluten-free)")]);

    const result = await resolveSubstitutes("soy sauce", fetchApi, findFallback);

    expect(result).toMatchObject({
      noSubstitute: false,
      source: "fallback",
      preferencesRelaxed: false,
    });
    expect(result.substitutes[0].text).toBe("tamari (1:1, gluten-free)");
    expect(findFallback).toHaveBeenCalledWith("soy sauce");
  });

  it("uses fallback when the API throws", async () => {
    const fetchApi = vi.fn().mockRejectedValue(new Error("401"));
    const findFallback = vi.fn().mockReturnValue([opt("melted butter (1:1)")]);

    const result = await resolveSubstitutes("vegetable oil", fetchApi, findFallback);

    expect(result.source).toBe("fallback");
    expect(result.substitutes[0].text).toBe("melted butter (1:1)");
  });

  it("marks noSubstitute when API and fallback are both empty", async () => {
    const fetchApi = vi.fn().mockResolvedValue([]);
    const findFallback = vi.fn().mockReturnValue([]);

    const result = await resolveSubstitutes("chicken breast", fetchApi, findFallback);

    expect(result).toEqual({
      substitutes: [],
      noSubstitute: true,
      source: "none",
      preferencesRelaxed: false,
    });
  });

  it("does not call fallback when API returns at least one result", async () => {
    const fetchApi = vi.fn().mockResolvedValue(["one option"]);
    const findFallback = vi.fn();

    await resolveSubstitutes("butter", fetchApi, findFallback);

    expect(findFallback).not.toHaveBeenCalled();
  });

  it("filters fallback with AND dietary preferences", async () => {
    const fetchApi = vi.fn().mockResolvedValue([]);
    const findFallback = vi.fn().mockReturnValue([
      opt("cashew cream", { nutFree: false }),
      opt("oat milk"),
      opt("Greek yogurt", { dairyFree: false, vegan: false }),
    ]);
    const prefs = {
      ...createEmptyDietaryPreferences(),
      dairyFree: true,
      nutFree: true,
    };

    const result = await resolveSubstitutes("cream", fetchApi, findFallback, prefs);

    expect(result.source).toBe("fallback");
    expect(result.preferencesRelaxed).toBe(false);
    expect(result.substitutes.map((s) => s.text)).toEqual(["oat milk"]);
  });

  it("relaxes preferences when no fallback options match", async () => {
    const fetchApi = vi.fn().mockResolvedValue([]);
    const findFallback = vi.fn().mockReturnValue([
      opt("milk + butter", { dairyFree: false, vegan: false }),
    ]);
    const prefs = { ...createEmptyDietaryPreferences(), dairyFree: true };

    const result = await resolveSubstitutes("cream", fetchApi, findFallback, prefs);

    expect(result.preferencesRelaxed).toBe(true);
    expect(result.substitutes).toHaveLength(1);
  });

  it("passes dietary preferences into the API fetch", async () => {
    const fetchApi = vi.fn().mockResolvedValue([]);
    const findFallback = vi.fn().mockReturnValue([]);
    const prefs = { ...createEmptyDietaryPreferences(), vegan: true };

    await resolveSubstitutes("egg", fetchApi, findFallback, prefs);

    expect(fetchApi).toHaveBeenCalledWith("egg", prefs);
  });

  it("falls back and filters when the API throws with preferences active", async () => {
    const fetchApi = vi.fn().mockRejectedValue(new Error("timeout"));
    const findFallback = vi.fn().mockReturnValue([
      opt("cashew cream", { nutFree: false }),
      opt("oat milk"),
    ]);
    const prefs = {
      ...createEmptyDietaryPreferences(),
      dairyFree: true,
      nutFree: true,
      glutenFree: true,
      soyFree: true,
      vegetarian: true,
      vegan: true,
    };

    const result = await resolveSubstitutes("cream", fetchApi, findFallback, prefs);

    expect(result.source).toBe("fallback");
    expect(result.preferencesRelaxed).toBe(false);
    expect(result.substitutes.map((s) => s.text)).toEqual(["oat milk"]);
  });
});
