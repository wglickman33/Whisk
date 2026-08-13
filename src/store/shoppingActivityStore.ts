import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shoppingListsApi, type ShoppingListItem } from "../api/client";
import type { ShoppingListStreamEvent } from "./shoppingListRealtimeStore";

export interface ShoppingActivity {
  id: string;
  listId: string;
  listName: string;
  itemName: string;
  addedByName: string;
  createdAt: string;
  read: boolean;
}

const MAX_ACTIVITIES = 50;

interface ShoppingActivityState {
  activities: ShoppingActivity[];
  initializedListIds: string[];
  knownItemIds: Record<string, string[]>;
  syncing: boolean;
  unreadCount: number;
  sync: (currentUserId: string) => Promise<void>;
  ingestStreamEvent: (event: ShoppingListStreamEvent, currentUserId: string) => void;
  markAllRead: () => void;
  markListRead: (listId: string) => void;
  clear: () => void;
}

function appendActivities(
  incoming: ShoppingActivity[],
  existing: ShoppingActivity[]
): ShoppingActivity[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((row) => row.id));
  const merged = incoming.filter((row) => !seen.has(row.id));
  if (merged.length === 0) return existing;
  return [...merged, ...existing]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_ACTIVITIES);
}

function itemToActivity(
  item: ShoppingListItem,
  listId: string,
  listName: string
): ShoppingActivity {
  return {
    id: item.id,
    listId,
    listName,
    itemName: item.name,
    addedByName: item.addedByName,
    createdAt: item.createdAt,
    read: false,
  };
}

function detectNewRemoteItems(
  previousIds: Set<string>,
  items: ShoppingListItem[],
  currentUserId: string
): ShoppingListItem[] {
  return items.filter(
    (item) => !previousIds.has(item.id) && item.addedByUserId !== currentUserId
  );
}

function computeUnread(activities: ShoppingActivity[]): number {
  return activities.filter((a) => !a.read).length;
}

export const useShoppingActivityStore = create<ShoppingActivityState>()(
  persist(
    (set, get) => ({
      activities: [],
      initializedListIds: [],
      knownItemIds: {},
      syncing: false,
      unreadCount: 0,

      sync: async (currentUserId) => {
        if (get().syncing) return;
        set({ syncing: true });
        try {
          const { lists } = await shoppingListsApi.list();
          const initialized = new Set(get().initializedListIds);
          const known = { ...get().knownItemIds };
          const existingActivityIds = new Set(get().activities.map((a) => a.id));
          const newActivities: ShoppingActivity[] = [];

          await Promise.all(
            lists.map(async (list) => {
              const { items } = await shoppingListsApi.getItems(list.id);
              const itemIds = items.map((item) => item.id);

              if (!initialized.has(list.id)) {
                known[list.id] = itemIds;
                initialized.add(list.id);
                return;
              }

              const previousIds = new Set(known[list.id] ?? []);
              const remoteAdds = detectNewRemoteItems(previousIds, items, currentUserId);

              for (const item of remoteAdds) {
                if (existingActivityIds.has(item.id)) continue;
                newActivities.push(itemToActivity(item, list.id, list.name));
              }

              known[list.id] = itemIds;
            })
          );

          if (newActivities.length === 0 && initialized.size === get().initializedListIds.length) {
            set({ knownItemIds: known, initializedListIds: [...initialized] });
            return;
          }

          const merged = appendActivities(newActivities, get().activities);

          set({
            activities: merged,
            initializedListIds: [...initialized],
            knownItemIds: known,
            unreadCount: computeUnread(merged),
          });
        } catch {
          /* offline or auth error - keep last known state */
        } finally {
          set({ syncing: false });
        }
      },

      ingestStreamEvent: (event, currentUserId) => {
        if (event.actorUserId === currentUserId) return;

        const existingActivityIds = new Set(get().activities.map((a) => a.id));
        const known = { ...get().knownItemIds };
        const incoming: ShoppingActivity[] = [];

        if (event.type === "item.created") {
          known[event.listId] = [...(known[event.listId] ?? []), event.item.id];
          if (!existingActivityIds.has(event.item.id)) {
            incoming.push(itemToActivity(event.item, event.listId, event.listName));
          }
        } else if (event.type === "items.bulk_created") {
          const ids = new Set(known[event.listId] ?? []);
          for (const item of event.items) {
            ids.add(item.id);
            if (!existingActivityIds.has(item.id)) {
              incoming.push(itemToActivity(item, event.listId, event.listName));
            }
          }
          known[event.listId] = [...ids];
        }

        if (incoming.length === 0) {
          if (Object.keys(known).length > 0) set({ knownItemIds: known });
          return;
        }

        const activities = appendActivities(incoming, get().activities);
        set({
          activities,
          knownItemIds: known,
          unreadCount: computeUnread(activities),
        });
      },

      markAllRead: () => {
        set((state) => {
          const activities = state.activities.map((a) => ({ ...a, read: true }));
          return { activities, unreadCount: 0 };
        });
      },

      markListRead: (listId) => {
        set((state) => {
          const activities = state.activities.map((a) =>
            a.listId === listId ? { ...a, read: true } : a
          );
          return { activities, unreadCount: computeUnread(activities) };
        });
      },

      clear: () => {
        set({
          activities: [],
          initializedListIds: [],
          knownItemIds: {},
          unreadCount: 0,
        });
      },
    }),
    {
      name: "whisk-shopping-activity",
      partialize: (state) => ({
        activities: state.activities,
        initializedListIds: state.initializedListIds,
        knownItemIds: state.knownItemIds,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
