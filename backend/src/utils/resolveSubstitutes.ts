import {
  applyDietaryFilter,
  createEmptyDietaryPreferences,
  hasActiveDietaryPreferences,
  stringsToSubstituteOptions,
  type DietaryPreferences,
  type SubstituteOption,
} from "./dietaryPreferences.js";
import { findFallbackSubstitutes } from "./substituteLookup.js";

export type SubstituteResolution = {
  substitutes: SubstituteOption[];
  noSubstitute: boolean;
  source: "api" | "fallback" | "none";
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
