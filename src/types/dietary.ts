/** Universal dietary preference flags - not certification or cultural claims. */
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

export const DIETARY_PREFERENCE_KEYS: DietaryPreferenceKey[] = [
  "dairyFree",
  "glutenFree",
  "nutFree",
  "soyFree",
  "vegetarian",
  "vegan",
];

export const DIETARY_PREFERENCE_LABELS: Record<DietaryPreferenceKey, string> = {
  dairyFree: "Dairy-free",
  glutenFree: "Gluten-free",
  nutFree: "Nut-free",
  soyFree: "Soy-free",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
};

export const DEFAULT_DIETARY_PREFERENCES: DietaryPreferences = {
  dairyFree: false,
  glutenFree: false,
  nutFree: false,
  soyFree: false,
  vegetarian: false,
  vegan: false,
};

export const DIETARY_FILTER_DISCLAIMER =
  "Reflects ingredient category, not verified certification or packaging - always check labels if this matters for you.";

export const SOURCING_NOTE_ANIMAL_DERIVED =
  "May be animal-derived depending on source - check labeling if this matters for you.";
