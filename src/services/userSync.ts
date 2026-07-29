import { preferencesApi, shoppingListsApi } from "../api/client";
import {
  hasPersistedSettings,
  parseTheme,
  parseUnitCategory,
  useSettingsStore,
  waitForSettingsHydration,
} from "../store/settingsStore";
import { scaledIngredientToListItem } from "../utils/shoppingListUtils";

const LEGACY_STORAGE_KEY = "recipe-app-shopping-list";

interface LegacyItem {
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
}

export function readLegacyLocalItems(): LegacyItem[] {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { state?: { items?: LegacyItem[] } };
    return Array.isArray(parsed.state?.items) ? parsed.state.items : [];
  } catch {
    return [];
  }
}

export function legacyItemToInput(item: LegacyItem) {
  return scaledIngredientToListItem({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    notes: item.notes,
  });
}

export function shouldMigrateLegacyShoppingList(
  localCount: number,
  serverListCount: number
): boolean {
  return serverListCount === 0 && localCount > 0;
}

async function syncPreferencesFromServer(): Promise<void> {
  await waitForSettingsHydration();

  const prefs = await preferencesApi.get();
  const settings = useSettingsStore.getState();
  const localTheme = settings.theme;
  const localCategory = settings.defaultUnitCategory;
  const serverTheme = parseTheme(prefs.theme);
  const serverCategory = parseUnitCategory(prefs.defaultUnitCategory);

  const differs = localTheme !== serverTheme || localCategory !== serverCategory;

  if (differs && hasPersistedSettings()) {
    try {
      await settings.savePreferences();
      return;
    } catch {
      settings.applyFromServer(prefs.theme, prefs.defaultUnitCategory);
      settings.markSynced();
      return;
    }
  }

  settings.applyFromServer(prefs.theme, prefs.defaultUnitCategory);
  settings.markSynced();
}

/** Pull server preferences; migrate legacy local shopping list if the user has none. */
export async function syncUserDataFromServer(): Promise<void> {
  await syncPreferencesFromServer();

  const { lists } = await shoppingListsApi.list();
  const legacyItems = readLegacyLocalItems();

  if (shouldMigrateLegacyShoppingList(legacyItems.length, lists.length)) {
    const { list } = await shoppingListsApi.create("Shopping list");
    await shoppingListsApi.bulkAdd(list.id, legacyItems.map(legacyItemToInput));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return;
  }

  if (legacyItems.length > 0) {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

export function clearUserSyncedState(): void {
  useSettingsStore.getState().resetSyncState();
}
