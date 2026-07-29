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

export type AddTargetResult =
  | { status: "ready"; listId: string; listName: string; items: ShoppingListItemInput[] }
  | { status: "pick"; lists: ShoppingList[]; items: ShoppingListItemInput[] }
  | { status: "empty" };

export function resolvePreferredListId(lists: ShoppingList[]): string | null {
  if (lists.length === 0) return null;
  const stored = getStoredListId();
  if (stored && lists.some((list) => list.id === stored)) return stored;
  if (lists.length === 1) return lists[0].id;
  return null;
}

/** Resolve which list to add to without writing items yet. */
export async function resolveAddTarget(
  items: ShoppingListItemInput[]
): Promise<AddTargetResult> {
  if (items.length === 0) return { status: "empty" };

  const { lists } = await shoppingListsApi.list();
  if (lists.length === 0) {
    const { list } = await shoppingListsApi.create(DEFAULT_LIST_NAME);
    storeListId(list.id);
    return { status: "ready", listId: list.id, listName: list.name, items };
  }

  if (lists.length === 1) {
    return { status: "ready", listId: lists[0].id, listName: lists[0].name, items };
  }

  const preferredId = resolvePreferredListId(lists);
  if (preferredId) {
    const preferred = lists.find((list) => list.id === preferredId);
    if (preferred) {
      return { status: "ready", listId: preferred.id, listName: preferred.name, items };
    }
  }

  return { status: "pick", lists, items };
}

export async function prepareAddToShoppingList(
  items: ShoppingListItemInput[]
): Promise<AddToListResult> {
  const target = await resolveAddTarget(items);
  if (target.status === "empty") return { status: "empty" };
  if (target.status === "pick") return target;

  await shoppingListsApi.bulkAdd(target.listId, target.items);
  storeListId(target.listId);
  return { status: "added", listId: target.listId, listName: target.listName };
}

export async function bulkAddToList(
  listId: string,
  items: ShoppingListItemInput[]
): Promise<void> {
  await shoppingListsApi.bulkAdd(listId, items);
  storeListId(listId);
}
