import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UnitCategory } from "../converters/utils/unitUtils";
import { preferencesApi } from "../api/client";

type Theme = "light" | "dark";

interface SettingsState {
  theme: Theme;
  defaultUnitCategory: UnitCategory;
  syncReady: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setDefaultUnitCategory: (category: UnitCategory) => void;
  applyFromServer: (theme: Theme, defaultUnitCategory: string) => void;
  markSynced: () => void;
  resetSyncState: () => void;
}

const VALID_CATEGORIES: UnitCategory[] = [
  "volume", "weight", "length", "area", "time",
  "speed", "pressure", "energy", "data", "temp",
];

function applyThemeToDom(theme: Theme): void {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function parseCategory(value: string): UnitCategory {
  return VALID_CATEGORIES.includes(value as UnitCategory)
    ? (value as UnitCategory)
    : "volume";
}

let prefsTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePrefsSave(get: () => SettingsState): void {
  if (!get().syncReady || !localStorage.getItem("whisk_token")) return;
  if (prefsTimer) clearTimeout(prefsTimer);
  prefsTimer = setTimeout(async () => {
    const { theme, defaultUnitCategory } = get();
    try {
      await preferencesApi.update({ theme, defaultUnitCategory });
    } catch {
      /* silent */
    }
  }, 600);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: "light",
      defaultUnitCategory: "volume",
      syncReady: false,

      applyFromServer: (theme, defaultUnitCategory) => {
        const category = parseCategory(defaultUnitCategory);
        applyThemeToDom(theme);
        set({ theme, defaultUnitCategory: category });
      },

      markSynced: () => set({ syncReady: true }),

      resetSyncState: () => {
        if (prefsTimer) clearTimeout(prefsTimer);
        set({ syncReady: false });
      },

      setTheme: (theme) => {
        applyThemeToDom(theme);
        set({ theme });
        schedulePrefsSave(get);
      },

      toggleTheme: () =>
        set((s) => {
          const next = s.theme === "light" ? "dark" : "light";
          applyThemeToDom(next);
          schedulePrefsSave(get);
          return { theme: next };
        }),

      setDefaultUnitCategory: (category) => {
        set({ defaultUnitCategory: category });
        schedulePrefsSave(get);
      },
    }),
    {
      name: "recipe-app-settings",
      partialize: (s) => ({ theme: s.theme, defaultUnitCategory: s.defaultUnitCategory }),
    }
  )
);
