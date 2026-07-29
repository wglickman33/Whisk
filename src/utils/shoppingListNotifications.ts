import type { ShoppingListItem } from "../api/client";

export function detectRemoteItemAdds(
  previous: ShoppingListItem[],
  next: ShoppingListItem[],
  currentUserId: string
): { count: number; names: string[] } {
  const previousIds = new Set(previous.map((item) => item.id));
  const added = next.filter(
    (item) => !previousIds.has(item.id) && item.addedByUserId !== currentUserId
  );
  return {
    count: added.length,
    names: added.map((item) => item.name),
  };
}

export function formatRemoteAddMessage(names: string[], count: number): string {
  if (count === 1) return `${names[0]} was added to the list.`;
  if (count === 2) return `${names[0]} and ${names[1]} were added.`;
  return `${count} new items were added to the list.`;
}
