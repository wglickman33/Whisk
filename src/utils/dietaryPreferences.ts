import {
  DEFAULT_DIETARY_PREFERENCES,
  DIETARY_PREFERENCE_KEYS,
  type DietaryPreferences,
  type DietaryPreferenceKey,
  type SubstituteOption,
} from "../types/dietary";

export function createEmptyDietaryPreferences(): DietaryPreferences {
  return { ...DEFAULT_DIETARY_PREFERENCES };
}

export function parseDietaryPreferences(value: unknown): DietaryPreferences {
  const base = createEmptyDietaryPreferences();
  if (!value || typeof value !== "object") return base;
  const raw = value as Record<string, unknown>;
  for (const key of DIETARY_PREFERENCE_KEYS) {
    if (typeof raw[key] === "boolean") base[key] = raw[key];
  }
  return base;
}

export function hasActiveDietaryPreferences(prefs: DietaryPreferences): boolean {
  return DIETARY_PREFERENCE_KEYS.some((key) => prefs[key]);
}

export function activeDietaryPreferenceKeys(
  prefs: DietaryPreferences
): DietaryPreferenceKey[] {
  return DIETARY_PREFERENCE_KEYS.filter((key) => prefs[key]);
}

/** AND filter: every active preference must be satisfied. */
export function filterSubstitutesByPreferences(
  options: SubstituteOption[],
  prefs: DietaryPreferences
): SubstituteOption[] {
  const active = activeDietaryPreferenceKeys(prefs);
  if (active.length === 0) return options;
  return options.filter((option) => active.every((key) => option[key]));
}

/**
 * Filter options; if none match, return the original list and mark relaxed.
 * Never leaves a blank result when unfiltered options exist.
 */
export function applyDietaryFilter(
  options: SubstituteOption[],
  prefs: DietaryPreferences
): { options: SubstituteOption[]; preferencesRelaxed: boolean } {
  if (!hasActiveDietaryPreferences(prefs) || options.length === 0) {
    return { options, preferencesRelaxed: false };
  }
  const filtered = filterSubstitutesByPreferences(options, prefs);
  if (filtered.length > 0) {
    return { options: filtered, preferencesRelaxed: false };
  }
  return { options, preferencesRelaxed: true };
}

/** Map Whisk prefs → Spoonacular `intolerances` + `diet` query params. */
export function mapDietaryPreferencesToSpoonacular(prefs: DietaryPreferences): {
  intolerances: string;
  diet: string;
} {
  const intolerances: string[] = [];
  if (prefs.dairyFree) intolerances.push("dairy");
  if (prefs.glutenFree) intolerances.push("gluten");
  if (prefs.nutFree) {
    intolerances.push("peanut");
    intolerances.push("tree nut");
  }
  if (prefs.soyFree) intolerances.push("soy");

  let diet = "";
  if (prefs.vegan) diet = "vegan";
  else if (prefs.vegetarian) diet = "vegetarian";

  return {
    intolerances: intolerances.join(","),
    diet,
  };
}

/** Wrap plain API strings as options (untagged — filtering is via Spoonacular params). */
export function stringsToSubstituteOptions(texts: string[]): SubstituteOption[] {
  return texts.map((text) => ({
    text,
    dairyFree: true,
    glutenFree: true,
    nutFree: true,
    soyFree: true,
    vegetarian: true,
    vegan: true,
  }));
}
