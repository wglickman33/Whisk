import {
  shoppingListsApi,
  type ShoppingList,
  type ShoppingListItemInput,
} from "../api/client";
import { getStoredListId, storeListId } from "./shoppingListUtils";

export const DEFAULT_LIST_NAME = "Shopping list";

export type AddToListResult =
  | { status: "added"; listId: string; listName: string }
  | { status: "pick"; lists: ShoppingList[]; items: ShoppingListItemInput[] }
  | { status: "empty" };

export function resolvePreferredListId(lists: ShoppingList[]): string | null {
  if (lists.length === 0) return null;
  const stored = getStoredListId();
  if (stored && lists.some((list) => list.id === stored)) return stored;
  if (lists.length === 1) return lists[0].id;
  return null;
}

export async function prepareAddToShoppingList(
  items: ShoppingListItemInput[]
): Promise<AddToListResult> {
  if (items.length === 0) return { status: "empty" };

  const { lists } = await shoppingListsApi.list();
  if (lists.length === 0) {
    const { list } = await shoppingListsApi.create(DEFAULT_LIST_NAME);
    storeListId(list.id);
    await shoppingListsApi.bulkAdd(list.id, items);
    return { status: "added", listId: list.id, listName: list.name };
  }

  if (lists.length === 1) {
    await shoppingListsApi.bulkAdd(lists[0].id, items);
    storeListId(lists[0].id);
    return { status: "added", listId: lists[0].id, listName: lists[0].name };
  }

  const preferredId = resolvePreferredListId(lists);
  if (preferredId) {
    const preferred = lists.find((list) => list.id === preferredId);
    if (preferred) {
      await shoppingListsApi.bulkAdd(preferred.id, items);
      storeListId(preferred.id);
      return { status: "added", listId: preferred.id, listName: preferred.name };
    }
  }

  return { status: "pick", lists, items };
}

export async function bulkAddToList(
  listId: string,
  items: ShoppingListItemInput[]
): Promise<void> {
  await shoppingListsApi.bulkAdd(listId, items);
  storeListId(listId);
}
