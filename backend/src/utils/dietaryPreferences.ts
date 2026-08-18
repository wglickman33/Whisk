export type DietaryPreferenceKey =
  | "dairyFree"
  | "glutenFree"
  | "nutFree"
  | "soyFree"
  | "vegetarian"
  | "vegan";

export type DietaryPreferences = Record<DietaryPreferenceKey, boolean>;

export interface SubstituteOption {
  text: string;
  dairyFree: boolean;
  glutenFree: boolean;
  nutFree: boolean;
  soyFree: boolean;
  vegetarian: boolean;
  vegan: boolean;
  sourcingNote?: string;
}

export const SOURCING_NOTE_ANIMAL_DERIVED =
  "May be animal-derived depending on source - check labeling if this matters for you.";

export const DIETARY_PREFERENCE_KEYS: DietaryPreferenceKey[] = [
  "dairyFree",
  "glutenFree",
  "nutFree",
  "soyFree",
  "vegetarian",
  "vegan",
];

export const DEFAULT_DIETARY_PREFERENCES: DietaryPreferences = {
  dairyFree: false,
  glutenFree: false,
  nutFree: false,
  soyFree: false,
  vegetarian: false,
  vegan: false,
};

export function parseDietaryPreferences(value: unknown): DietaryPreferences {
  const base = { ...DEFAULT_DIETARY_PREFERENCES };
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  const raw = value as Record<string, unknown>;
  for (const key of DIETARY_PREFERENCE_KEYS) {
    if (typeof raw[key] === "boolean") base[key] = raw[key];
  }
  return base;
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

export function createEmptyDietaryPreferences(): DietaryPreferences {
  return { ...DEFAULT_DIETARY_PREFERENCES };
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

/** Wrap plain API strings as options (untagged - filtering is via Spoonacular params). */
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

export function parseDietaryPreferencesFromQuery(
  query: Record<string, unknown>
): DietaryPreferences {
  const prefs = { ...DEFAULT_DIETARY_PREFERENCES };
  for (const key of DIETARY_PREFERENCE_KEYS) {
    const raw = query[key];
    if (raw === "1" || raw === "true" || raw === true) prefs[key] = true;
    if (raw === "0" || raw === "false" || raw === false) prefs[key] = false;
  }
  return prefs;
}
