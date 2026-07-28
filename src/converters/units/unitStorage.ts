import type { UnitCategory } from "./unitUtils";

export type SavedConversion = {
  category: UnitCategory;
  fromUnit: string;
  toUnit: string;
  input: string;
  savedAt: number;
};

export type FavoritePair = {
  id: string;
  category: UnitCategory;
  fromUnit: string;
  toUnit: string;
  label: string;
};

const RECENT_KEY = "whisk-unit-recent";
const FAVORITES_KEY = "whisk-unit-favorites";
const MAX_RECENT = 5;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getRecentConversions(): SavedConversion[] {
  return readJson<SavedConversion[]>(RECENT_KEY, []);
}

export function addRecentConversion(entry: Omit<SavedConversion, "savedAt">): SavedConversion[] {
  const next: SavedConversion = { ...entry, savedAt: Date.now() };
  const existing = getRecentConversions().filter(
    (item) =>
      !(
        item.category === next.category &&
        item.fromUnit === next.fromUnit &&
        item.toUnit === next.toUnit &&
        item.input === next.input
      )
  );
  const updated = [next, ...existing].slice(0, MAX_RECENT);
  writeJson(RECENT_KEY, updated);
  return updated;
}

export function getFavoritePairs(): FavoritePair[] {
  return readJson<FavoritePair[]>(FAVORITES_KEY, []);
}

export function addFavoritePair(
  pair: Omit<FavoritePair, "id" | "label"> & { label?: string }
): FavoritePair[] {
  const favorites = getFavoritePairs();
  const exists = favorites.some(
    (f) =>
      f.category === pair.category &&
      f.fromUnit === pair.fromUnit &&
      f.toUnit === pair.toUnit
  );
  if (exists) return favorites;

  const label = pair.label ?? `${pair.fromUnit} → ${pair.toUnit}`;
  const next: FavoritePair = {
    id: crypto.randomUUID(),
    category: pair.category,
    fromUnit: pair.fromUnit,
    toUnit: pair.toUnit,
    label,
  };
  const updated = [...favorites, next];
  writeJson(FAVORITES_KEY, updated);
  return updated;
}

export function removeFavoritePair(id: string): FavoritePair[] {
  const updated = getFavoritePairs().filter((f) => f.id !== id);
  writeJson(FAVORITES_KEY, updated);
  return updated;
}

export function isFavoritePair(
  category: UnitCategory,
  fromUnit: string,
  toUnit: string
): boolean {
  return getFavoritePairs().some(
    (f) => f.category === category && f.fromUnit === fromUnit && f.toUnit === toUnit
  );
}
