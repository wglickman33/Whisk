import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ShoppingListItem, ShoppingListItemInput } from "../api/client";
import { shoppingListApi } from "../api/client";

export type { ShoppingListItem };

function normalizeKey(name: string, unit: string): string {
  return `${name.trim().toLowerCase()}|${(unit || "").trim().toLowerCase()}`;
}

function generateId(): string {
  return `sl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

interface ShoppingListState {
  items: ShoppingListItem[];
  syncReady: boolean;
  addItem: (item: Omit<ShoppingListItem, "id">) => void;
  addItems: (items: Omit<ShoppingListItem, "id">[]) => void;
  addRecipe: (
    recipe: {
      title: string;
      id: string;
      servings: number;
      ingredients: { name: string; quantity: number; unit: string; notes: string | null }[];
    },
    servingsScale: number
  ) => void;
  removeItem: (id: string) => void;
  clearList: () => void;
  getCombined: () => { key: string; name: string; unit: string; quantity: number; ids: string[] }[];
  replaceItems: (items: ShoppingListItem[], options?: { skipSave?: boolean }) => void;
  markSynced: () => void;
  resetSyncState: () => void;
  scheduleSave: () => void;
}

function toApiItems(items: ShoppingListItem[]): ShoppingListItemInput[] {
  return items.map(({ name, quantity, unit, notes, sourceRecipeId, sourceRecipeTitle }) => ({
    name,
    quantity,
    unit,
    notes,
    sourceRecipeId,
    sourceRecipeTitle,
  }));
}

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set, get) => ({
      items: [],
      syncReady: false,

      scheduleSave: () => {
        if (!get().syncReady) return;
        if (!localStorage.getItem("whisk_token")) return;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
          try {
            const { items } = get();
            const { items: saved } = await shoppingListApi.save(toApiItems(items));
            set({ items: saved });
          } catch {
            /* silent — user can retry on next edit */
          }
        }, 800);
      },

      replaceItems: (items, options) => {
        set({ items });
        if (!options?.skipSave) get().scheduleSave();
      },

      markSynced: () => set({ syncReady: true }),

      resetSyncState: () => {
        if (saveTimer) clearTimeout(saveTimer);
        set({ syncReady: false });
      },

      addItem: (item) => {
        set((s) => ({
          items: [...s.items, { ...item, id: generateId() }],
        }));
        get().scheduleSave();
      },

      addItems: (items) => {
        set((s) => ({
          items: [...s.items, ...items.map((item) => ({ ...item, id: generateId() }))],
        }));
        get().scheduleSave();
      },

      addRecipe: (recipe, servingsScale) => {
        const scale = recipe.servings > 0 ? servingsScale / recipe.servings : 1;
        const newItems: Omit<ShoppingListItem, "id">[] = (recipe.ingredients || []).map(
          (ing) => ({
            name: ing.name.trim(),
            quantity: ing.quantity * scale,
            unit: (ing.unit || "").trim(),
            notes: ing.notes ?? null,
            sourceRecipeId: recipe.id,
            sourceRecipeTitle: recipe.title,
          })
        );
        get().addItems(newItems);
      },

      removeItem: (id) => {
        set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
        get().scheduleSave();
      },

      clearList: () => {
        set({ items: [] });
        get().scheduleSave();
      },

      getCombined: () => {
        const { items } = get();
        const map = new Map<
          string,
          { name: string; unit: string; quantity: number; ids: string[] }
        >();
        for (const item of items) {
          const key = normalizeKey(item.name, item.unit);
          const existing = map.get(key);
          if (existing) {
            existing.quantity += item.quantity;
            existing.ids.push(item.id);
          } else {
            map.set(key, {
              name: item.name,
              unit: item.unit,
              quantity: item.quantity,
              ids: [item.id],
            });
          }
        }
        return Array.from(map.entries()).map(([key, v]) => ({
          key,
          name: v.name,
          unit: v.unit,
          quantity: v.quantity,
          ids: v.ids,
        }));
      },
    }),
    { name: "recipe-app-shopping-list", partialize: (s) => ({ items: s.items }) }
  )
);
