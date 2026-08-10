export type DietaryPreferenceKey =
  | "dairyFree"
  | "glutenFree"
  | "nutFree"
  | "soyFree"
  | "vegetarian"
  | "vegan";

export type DietaryPreferences = Record<DietaryPreferenceKey, boolean>;

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
