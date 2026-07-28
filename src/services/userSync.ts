import { preferencesApi, shoppingListApi } from "../api/client";
import { useShoppingListStore } from "../store/shoppingListStore";
import { useSettingsStore } from "../store/settingsStore";

/** Whether local guest items should upload on first sign-in. */
export function shouldMigrateLocalShoppingList(
  localCount: number,
  serverCount: number
): boolean {
  return serverCount === 0 && localCount > 0;
}

/** Pull server data after sign-in; migrate local shopping list if server is empty. */
export async function syncUserDataFromServer(): Promise<void> {
  const [prefs, serverList] = await Promise.all([
    preferencesApi.get(),
    shoppingListApi.get(),
  ]);

  const settings = useSettingsStore.getState();
  settings.applyFromServer(prefs.theme as "light" | "dark", prefs.defaultUnitCategory);

  const shopping = useShoppingListStore.getState();
  const localItems = shopping.items;

  if (shouldMigrateLocalShoppingList(localItems.length, serverList.items.length)) {
    const migrated = await shoppingListApi.save(
      localItems.map(({ name, quantity, unit, notes, sourceRecipeId, sourceRecipeTitle }) => ({
        name,
        quantity,
        unit,
        notes,
        sourceRecipeId,
        sourceRecipeTitle,
      }))
    );
    shopping.replaceItems(migrated.items, { skipSave: true });
  } else {
    shopping.replaceItems(serverList.items, { skipSave: true });
  }

  shopping.markSynced();
  useSettingsStore.getState().markSynced();
}

export function clearUserSyncedState(): void {
  const shopping = useShoppingListStore.getState();
  shopping.resetSyncState();
  shopping.replaceItems([], { skipSave: true });
}
