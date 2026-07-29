import { create } from "zustand";
import type { ShoppingListItem } from "../api/client";

export type ShoppingListStreamEvent =
  | {
      type: "item.created";
      listId: string;
      listName: string;
      actorUserId: string;
      item: ShoppingListItem;
    }
  | {
      type: "item.updated";
      listId: string;
      listName: string;
      actorUserId: string;
      item: ShoppingListItem;
    }
  | {
      type: "item.deleted";
      listId: string;
      listName: string;
      actorUserId: string;
      itemId: string;
    }
  | {
      type: "items.bulk_created";
      listId: string;
      listName: string;
      actorUserId: string;
      items: ShoppingListItem[];
    }
  | {
      type: "items.cleared";
      listId: string;
      listName: string;
      actorUserId: string;
    }
  | {
      type: "list.updated";
      listId: string;
      listName: string;
      actorUserId: string;
    };

type StreamListener = (event: ShoppingListStreamEvent) => void;

interface ShoppingListRealtimeState {
  listeners: Set<StreamListener>;
  subscribe: (listener: StreamListener) => () => void;
  publish: (event: ShoppingListStreamEvent) => void;
}

export const useShoppingListRealtimeStore = create<ShoppingListRealtimeState>((set, get) => ({
  listeners: new Set(),
  subscribe: (listener) => {
    const listeners = new Set(get().listeners);
    listeners.add(listener);
    set({ listeners });
    return () => {
      const next = new Set(get().listeners);
      next.delete(listener);
      set({ listeners: next });
    };
  },
  publish: (event) => {
    for (const listener of get().listeners) listener(event);
  },
}));

export function applyStreamEventToItems(
  items: ShoppingListItem[],
  event: ShoppingListStreamEvent
): ShoppingListItem[] {
  switch (event.type) {
    case "item.created":
      if (items.some((row) => row.id === event.item.id)) return items;
      return [...items, event.item];
    case "item.updated":
      return items.map((row) => (row.id === event.item.id ? event.item : row));
    case "item.deleted":
      return items.filter((row) => row.id !== event.itemId);
    case "items.bulk_created": {
      const ids = new Set(items.map((row) => row.id));
      const merged = [...items];
      for (const item of event.items) {
        if (!ids.has(item.id)) merged.push(item);
      }
      return merged;
    }
    case "items.cleared":
      return items.filter((row) => !row.checked);
    default:
      return items;
  }
}
