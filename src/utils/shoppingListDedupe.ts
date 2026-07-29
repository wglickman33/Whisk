import type { ShoppingListItem, ShoppingListItemInput } from "../api/client";

export function normalizeShoppingItemName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Unchecked list items whose names match incoming bulk adds (case-insensitive). */
export function findDuplicateItemNames(
  incoming: ShoppingListItemInput[],
  existing: ShoppingListItem[]
): string[] {
  const existingNames = new Set(
    existing
      .filter((item) => !item.checked)
      .map((item) => normalizeShoppingItemName(item.name))
      .filter(Boolean)
  );

  const duplicates = new Set<string>();
  for (const item of incoming) {
    const key = normalizeShoppingItemName(item.name);
    if (!key) continue;
    if (existingNames.has(key)) duplicates.add(item.name.trim());
  }

  return [...duplicates].sort((a, b) => a.localeCompare(b));
}

/** Incoming items whose names are not already on the list (unchecked). */
export function filterNonDuplicateItems(
  incoming: ShoppingListItemInput[],
  existing: ShoppingListItem[]
): ShoppingListItemInput[] {
  const existingNames = new Set(
    existing
      .filter((item) => !item.checked)
      .map((item) => normalizeShoppingItemName(item.name))
      .filter(Boolean)
  );

  return incoming.filter((item) => {
    const key = normalizeShoppingItemName(item.name);
    return key && !existingNames.has(key);
  });
}

export function formatDuplicatePrompt(names: string[]): string {
  if (names.length === 1) return `${names[0]} is already on the list.`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are already on the list.`;
  return `${names.slice(0, 3).join(", ")}${names.length > 3 ? ` and ${names.length - 3} more` : ""} are already on the list.`;
}
