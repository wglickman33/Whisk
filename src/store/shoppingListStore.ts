import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  sourceRecipeId?: string;
  sourceRecipeTitle?: string;
}

function normalizeKey(name: string, unit: string): string {
  return `${name.trim().toLowerCase()}|${(unit || "").trim().toLowerCase()}`;
}

function generateId(): string {
  return `sl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ShoppingListState {
  items: ShoppingListItem[];
  addItem: (item: Omit<ShoppingListItem, "id">) => void;
  addItems: (items: Omit<ShoppingListItem, "id">[]) => void;
  addRecipe: (recipe: { title: string; id: string; servings: number; ingredients: { name: string; quantity: number; unit: string; notes: string | null }[] }, servingsScale: number) => void;
  removeItem: (id: string) => void;
  clearList: () => void;
  getCombined: () => { key: string; name: string; unit: string; quantity: number; ids: string[] }[];
}

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((s) => ({
          items: [...s.items, { ...item, id: generateId() }],
        }));
      },

      addItems: (items) => {
        set((s) => ({
          items: [
            ...s.items,
            ...items.map((item) => ({ ...item, id: generateId() })),
          ],
        }));
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
        set((s) => ({
          items: [
            ...s.items,
            ...newItems.map((item) => ({ ...item, id: generateId() })),
          ],
        }));
      },

      removeItem: (id) => {
        set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
      },

      clearList: () => set({ items: [] }),

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
