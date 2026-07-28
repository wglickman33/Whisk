import { formatQuantity } from "./formatQuantity";
import type { Ingredient, ShoppingListItemInput } from "../api/client";

export const UNCategorized_LABEL = "Other";

export function formatIngredientQuantity(quantity: number, unit: string): string | null {
  const parts: string[] = [];
  if (quantity > 0) parts.push(formatQuantity(quantity));
  const trimmedUnit = unit.trim();
  if (trimmedUnit) parts.push(trimmedUnit);
  return parts.length > 0 ? parts.join(" ") : null;
}

export function ingredientToListItem(ing: Pick<Ingredient, "name" | "quantity" | "unit" | "notes">): ShoppingListItemInput {
  return {
    name: ing.name.trim(),
    quantity: formatIngredientQuantity(ing.quantity, ing.unit),
    note: ing.notes?.trim() || null,
    category: null,
  };
}

export function scaledIngredientToListItem(item: {
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
}): ShoppingListItemInput {
  return {
    name: item.name.trim(),
    quantity: formatIngredientQuantity(item.quantity, item.unit),
    note: item.notes?.trim() || null,
    category: null,
  };
}

export function groupActiveItemsByCategory<T extends { category?: string; checked: boolean }>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (item.checked) continue;
    const label = item.category?.trim() || UNCategorized_LABEL;
    const bucket = groups.get(label);
    if (bucket) bucket.push(item);
    else groups.set(label, [item]);
  }
  return groups;
}

export function sortCategoryLabels(labels: string[]): string[] {
  return [...labels].sort((a, b) => {
    if (a === UNCategorized_LABEL) return 1;
    if (b === UNCategorized_LABEL) return -1;
    return a.localeCompare(b);
  });
}

export function itemNameSuggestions(
  names: string[],
  query: string,
  limit = 5
): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const seen = new Set<string>();
  const matches: string[] = [];

  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    if (!key.includes(q)) continue;
    seen.add(key);
    matches.push(name);
    if (matches.length >= limit) break;
  }

  return matches;
}

export const SELECTED_LIST_KEY = "whisk-selected-shopping-list";

export function getStoredListId(): string | null {
  return localStorage.getItem(SELECTED_LIST_KEY);
}

export function storeListId(listId: string): void {
  localStorage.setItem(SELECTED_LIST_KEY, listId);
}

export function clearStoredListId(): void {
  localStorage.removeItem(SELECTED_LIST_KEY);
}
