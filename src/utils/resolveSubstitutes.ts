import {
  applyDietaryFilter,
  hasActiveDietaryPreferences,
  stringsToSubstituteOptions,
} from "./dietaryPreferences";
import { findFallbackSubstitutes } from "./substituteLookup";
import type { DietaryPreferences, SubstituteOption } from "../types/dietary";
import { createEmptyDietaryPreferences } from "./dietaryPreferences";

export type SubstituteResolution = {
  substitutes: SubstituteOption[];
  noSubstitute: boolean;
  source: "api" | "fallback" | "none";
  /** True when no option matched active prefs, so unfiltered options are shown. */
  preferencesRelaxed: boolean;
};

export type FetchSubstitutes = (
  name: string,
  prefs: DietaryPreferences
) => Promise<string[]>;

export async function resolveSubstitutes(
  ingredientName: string,
  fetchApi: FetchSubstitutes,
  findFallback: (name: string) => SubstituteOption[] = findFallbackSubstitutes,
  preferences: DietaryPreferences = createEmptyDietaryPreferences()
): Promise<SubstituteResolution> {
  const prefsActive = hasActiveDietaryPreferences(preferences);

  try {
    const apiResults = await fetchApi(ingredientName, preferences);
    if (apiResults.length > 0) {
      // Spoonacular filtering is via query params; treat returned strings as display options.
      return {
        substitutes: stringsToSubstituteOptions(apiResults),
        noSubstitute: false,
        source: "api",
        preferencesRelaxed: false,
      };
    }

    const fallback = findFallback(ingredientName);
    const { options, preferencesRelaxed } = applyDietaryFilter(fallback, preferences);
    return {
      substitutes: options,
      noSubstitute: options.length === 0,
      source: options.length > 0 ? "fallback" : "none",
      preferencesRelaxed: prefsActive ? preferencesRelaxed : false,
    };
  } catch {
    const fallback = findFallback(ingredientName);
    const { options, preferencesRelaxed } = applyDietaryFilter(fallback, preferences);
    return {
      substitutes: options,
      noSubstitute: options.length === 0,
      source: options.length > 0 ? "fallback" : "none",
      preferencesRelaxed: prefsActive ? preferencesRelaxed : false,
    };
  }
}
