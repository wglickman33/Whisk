import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UnitCategory } from "../converters/units/unitUtils";
import { preferencesApi } from "../api/client";
import {
  createEmptyDietaryPreferences,
  parseDietaryPreferences,
} from "../utils/dietaryPreferences";
import type { DietaryPreferences, DietaryPreferenceKey } from "../types/dietary";
import {
  applyEffectiveTheme,
  isThemePreference,
  resolveEffectiveTheme,
  subscribeSystemTheme,
  type EffectiveTheme,
  type ThemePreference,
} from "../utils/theme";

export type Theme = ThemePreference;

export const SETTINGS_PERSIST_KEY = "recipe-app-settings";

interface SettingsState {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  defaultUnitCategory: UnitCategory;
  dietaryPreferences: DietaryPreferences;
  syncReady: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  getEffectiveTheme: () => EffectiveTheme;
  setDefaultUnitCategory: (category: UnitCategory) => void;
  setDietaryPreference: (key: DietaryPreferenceKey, value: boolean) => void;
  savePreferences: () => Promise<void>;
  applyFromServer: (
    theme: string,
    defaultUnitCategory: string,
    dietaryPreferences?: unknown
  ) => void;
  markSynced: () => void;
  resetSyncState: () => void;
}

const VALID_CATEGORIES: UnitCategory[] = [
  "volume", "weight", "length", "area", "time",
  "speed", "pressure", "energy", "data", "temp",
];

const THEME_CYCLE: Theme[] = ["light", "dark", "auto"];

export function parseTheme(value: string): Theme {
  return isThemePreference(value) ? value : "light";
}

export function parseUnitCategory(value: string): UnitCategory {
  return VALID_CATEGORIES.includes(value as UnitCategory)
    ? (value as UnitCategory)
    : "volume";
}

function applyThemePreference(theme: Theme, set?: (partial: Partial<SettingsState>) => void): EffectiveTheme {
  const effective = applyEffectiveTheme(theme);
  set?.({ effectiveTheme: effective });
  return effective;
}

let prefsTimer: ReturnType<typeof setTimeout> | null = null;
let systemThemeUnsubscribe: (() => void) | null = null;

function clearSystemThemeSubscription(): void {
  systemThemeUnsubscribe?.();
  systemThemeUnsubscribe = null;
}

function ensureSystemThemeSubscription(get: () => SettingsState): void {
  clearSystemThemeSubscription();
  if (get().theme !== "auto") return;
  systemThemeUnsubscribe = subscribeSystemTheme(() => {
    const effective = applyEffectiveTheme("auto");
    useSettingsStore.setState({ effectiveTheme: effective });
  });
}

function schedulePrefsSave(get: () => SettingsState): void {
  if (!localStorage.getItem("whisk_token")) return;
  if (prefsTimer) clearTimeout(prefsTimer);
  prefsTimer = setTimeout(async () => {
    try {
      await get().savePreferences();
    } catch {
      /* silent — sidebar quick toggle */
    }
  }, 600);
}

export function waitForSettingsHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useSettingsStore.persist.hasHydrated()) {
      resolve();
      return;
    }
    const unsub = useSettingsStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
    // Hydration may finish between the check above and the listener attach.
    if (useSettingsStore.persist.hasHydrated()) {
      unsub();
      resolve();
    }
  });
}

export function hasPersistedSettings(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(SETTINGS_PERSIST_KEY) != null;
}

export function initThemeSync(): () => void {
  const state = useSettingsStore.getState();
  applyThemePreference(state.theme, (partial) => useSettingsStore.setState(partial));
  ensureSystemThemeSubscription(() => useSettingsStore.getState());
  return () => {
    clearSystemThemeSubscription();
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: "light",
      effectiveTheme: "light",
      defaultUnitCategory: "volume",
      dietaryPreferences: createEmptyDietaryPreferences(),
      syncReady: false,

      getEffectiveTheme: () => resolveEffectiveTheme(get().theme),

      applyFromServer: (theme, defaultUnitCategory, dietaryPreferences) => {
        const parsedTheme = parseTheme(theme);
        const category = parseUnitCategory(defaultUnitCategory);
        const dietary = parseDietaryPreferences(dietaryPreferences);
        const effective = applyThemePreference(parsedTheme);
        ensureSystemThemeSubscription(get);
        set({
          theme: parsedTheme,
          effectiveTheme: effective,
          defaultUnitCategory: category,
          dietaryPreferences: dietary,
        });
      },

      markSynced: () => set({ syncReady: true }),

      resetSyncState: () => {
        if (prefsTimer) clearTimeout(prefsTimer);
        set({ syncReady: false });
      },

      savePreferences: async () => {
        const { theme, defaultUnitCategory, dietaryPreferences } = get();
        if (localStorage.getItem("whisk_token")) {
          await preferencesApi.update({ theme, defaultUnitCategory, dietaryPreferences });
        }
        set({ syncReady: true });
      },

      setTheme: (theme) => {
        const effective = applyThemePreference(theme);
        ensureSystemThemeSubscription(get);
        set({ theme, effectiveTheme: effective });
      },

      toggleTheme: () =>
        set((s) => {
          const currentIndex = THEME_CYCLE.indexOf(s.theme);
          const next = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
          const effective = applyThemePreference(next);
          ensureSystemThemeSubscription(get);
          schedulePrefsSave(get);
          return { theme: next, effectiveTheme: effective };
        }),

      setDefaultUnitCategory: (category) => {
        set({ defaultUnitCategory: category });
      },

      setDietaryPreference: (key, value) => {
        set((s) => ({
          dietaryPreferences: { ...s.dietaryPreferences, [key]: value },
        }));
      },
    }),
    {
      name: SETTINGS_PERSIST_KEY,
      partialize: (s) => ({
        theme: s.theme,
        defaultUnitCategory: s.defaultUnitCategory,
        dietaryPreferences: s.dietaryPreferences,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...p,
          dietaryPreferences: parseDietaryPreferences(p.dietaryPreferences),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const effective = applyThemePreference(state.theme);
        state.effectiveTheme = effective;
        state.dietaryPreferences = parseDietaryPreferences(state.dietaryPreferences);
        ensureSystemThemeSubscription(() => useSettingsStore.getState());
      },
    }
  )
);
