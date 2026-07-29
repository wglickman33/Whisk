import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useAuthModalStore } from "../store/authModalStore";
import {
  shoppingListsApi,
  recipesApi,
  type ShoppingList,
  type ShoppingListItem,
  type Recipe,
} from "../api/client";
import { toastSuccess, toastError } from "../store/toastStore";
import {
  groupActiveItemsByCategory,
  categorySuggestions,
  sortCategoryLabels,
  getStoredListId,
  storeListId,
  clearStoredListId,
  ingredientToListItem,
} from "../utils/shoppingListUtils";
import { inferIngredientCategory } from "../utils/inferIngredientCategory";
import { DEFAULT_LIST_NAME } from "../utils/shoppingListActions";
import { buildShoppingListJoinUrl } from "../utils/shoppingListShare";
import { findDuplicateItemNames, filterNonDuplicateItems } from "../utils/shoppingListDedupe";
import { useShoppingActivityStore } from "../store/shoppingActivityStore";
import {
  applyStreamEventToItems,
  useShoppingListRealtimeStore,
} from "../store/shoppingListRealtimeStore";
import { DuplicateItemsModal } from "../components/shopping/DuplicateItemsModal";
import { AddItemModal, type AddItemFormValues } from "../components/shopping/AddItemModal";
import { useClickOutside } from "../components/shopping/ListPickerModal";
import {
  ShoppingListItemRow,
  type ItemEditDraft,
} from "../components/shopping/ShoppingListItemRow";
import { IconShoppingList } from "../components/ui/SidebarIcons";
import "./ShoppingListPage.scss";

const LIST_POLL_MS = 30000;

function ShareCodeModal({
  code,
  shareUrl,
  loading,
  onClose,
}: {
  code: string | null;
  shareUrl: string | null;
  loading: boolean;
  onClose: () => void;
}) {
  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toastSuccess("Share code copied.");
    } catch {
      toastError("Could not copy code.");
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toastSuccess("Share link copied.");
    } catch {
      toastError("Could not copy link.");
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="shopping-list-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="shopping-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shopping-list-modal__header">
          <h2>Share list</h2>
          <button type="button" className="shopping-list-modal__close" onClick={onClose} aria-label="Close">
            <span aria-hidden>&times;</span>
          </button>
        </div>
        <div className="shopping-list-modal__body">
          <p className="shopping-list-modal__hint">
            Share the link or code with someone who already has a Whisk account.
          </p>
          {loading ? (
            <p className="shopping-list-modal__loading">Generating code…</p>
          ) : (
            <>
              <div className="shopping-list-modal__code-row">
                <code className="shopping-list-modal__code">{code}</code>
                <button type="button" className="shopping-list-modal__copy" onClick={copyCode} disabled={!code}>
                  Copy code
                </button>
              </div>
              {shareUrl && (
                <div className="shopping-list-modal__link-row">
                  <input
                    type="text"
                    className="shopping-list-modal__link-input"
                    value={shareUrl}
                    readOnly
                    aria-label="Share link"
                  />
                  <button type="button" className="shopping-list-modal__copy" onClick={copyLink}>
                    Copy link
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function JoinCodeModal({
  value,
  onChange,
  saving,
  onClose,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  return (
    <div className="shopping-list-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="shopping-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shopping-list-modal__header">
          <h2>Join a list</h2>
          <button type="button" className="shopping-list-modal__close" onClick={onClose} aria-label="Close" disabled={saving}>
            <span aria-hidden>&times;</span>
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="shopping-list-modal__body">
            <label className="shopping-list-modal__field">
              <span>Share code</span>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD34"
                autoComplete="off"
                disabled={saving}
                required
              />
            </label>
          </div>
          <div className="shopping-list-modal__actions">
            <button type="button" className="shopping-list-modal__cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="shopping-list-modal__submit" disabled={saving || !value.trim()}>
              {saving ? "Joining…" : "Join list"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecipePickerModal({
  recipes,
  loading,
  onClose,
  onPick,
}: {
  recipes: Recipe[];
  loading: boolean;
  onClose: () => void;
  onPick: (recipe: Recipe) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((recipe) => recipe.title.toLowerCase().includes(q));
  }, [recipes, search]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="shopping-list-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="shopping-list-modal shopping-list-modal--tall" onClick={(e) => e.stopPropagation()}>
        <div className="shopping-list-modal__header">
          <h2>Add from recipe</h2>
          <button type="button" className="shopping-list-modal__close" onClick={onClose} aria-label="Close">
            <span aria-hidden>&times;</span>
          </button>
        </div>
        <div className="shopping-list-modal__body shopping-list-modal__body--scroll">
          {loading ? (
            <p className="shopping-list-modal__loading">Loading recipes…</p>
          ) : recipes.length === 0 ? (
            <p className="shopping-list-modal__hint">No recipes yet. Create one from the Recipes page.</p>
          ) : (
            <>
              <input
                type="search"
                className="shopping-list-modal__search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipes…"
                aria-label="Search recipes"
              />
              {filtered.length === 0 ? (
                <p className="shopping-list-modal__hint">No recipes match your search.</p>
              ) : (
                <ul className="shopping-list-recipe-picker">
                  {filtered.map((recipe) => (
                    <li key={recipe.id}>
                      <button type="button" className="shopping-list-recipe-picker__btn" onClick={() => onPick(recipe)}>
                        <span className="shopping-list-recipe-picker__title">{recipe.title}</span>
                        <span className="shopping-list-recipe-picker__meta">
                          {recipe.ingredients.length} ingredient{recipe.ingredients.length === 1 ? "" : "s"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ShoppingListPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  const [searchParams, setSearchParams] = useSearchParams();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [memberRemovingId, setMemberRemovingId] = useState<string | null>(null);
  const [checkedOpen, setCheckedOpen] = useState(true);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinSaving, setJoinSaving] = useState(false);
  const [recipePickerOpen, setRecipePickerOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [listActionSaving, setListActionSaving] = useState(false);
  const [recipeAdding, setRecipeAdding] = useState(false);
  const [dupeConfirm, setDupeConfirm] = useState<{
    names: string[];
    bulkItems: ReturnType<typeof ingredientToListItem>[];
  } | null>(null);
  const subscribeRealtime = useShoppingListRealtimeStore((s) => s.subscribe);
  const switcherRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<ShoppingListItem[]>([]);

  const activeList = lists.find((l) => l.id === activeListId) ?? null;
  const shareUrl = shareCode ? buildShoppingListJoinUrl(shareCode) : null;

  useClickOutside(switcherRef, () => setSwitcherOpen(false), switcherOpen);
  useClickOutside(optionsRef, () => setOptionsOpen(false), optionsOpen);

  const loadLists = useCallback(async () => {
    setLoadingLists(true);
    try {
      const { lists: fetched } = await shoppingListsApi.list();
      setLists(fetched);
      const stored = getStoredListId();
      const nextId =
        (stored && fetched.some((l) => l.id === stored) ? stored : null) ??
        fetched[0]?.id ??
        null;
      setActiveListId(nextId);
      if (nextId) storeListId(nextId);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to load lists.");
    } finally {
      setLoadingLists(false);
    }
  }, []);

  const loadItems = useCallback(async (listId: string, quiet = false) => {
    if (!quiet) setLoadingItems(true);
    try {
      const { items: fetched } = await shoppingListsApi.getItems(listId);
      itemsRef.current = fetched;
      setItems(fetched);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (quiet && message.toLowerCase().includes("not found")) {
        void loadLists();
        return;
      }
      if (!quiet) {
        toastError(message || "Failed to load items.");
      }
    } finally {
      if (!quiet) setLoadingItems(false);
    }
  }, [loadLists]);

  useEffect(() => {
    if (!isSignedIn) return;
    useShoppingActivityStore.getState().markAllRead();
  }, [isSignedIn]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const code = searchParams.get("code")?.trim();
    if (!code) return;
    if (!isSignedIn) {
      openAuthModal("login");
      return;
    }
    setJoinCode(code.toUpperCase());
    setJoinOpen(true);
    setSearchParams({}, { replace: true });
  }, [isSignedIn, searchParams, setSearchParams, openAuthModal]);

  useEffect(() => {
    if (!isSignedIn) return;
    void loadLists();
  }, [isSignedIn, loadLists]);

  useEffect(() => {
    if (!activeListId) {
      setItems([]);
      itemsRef.current = [];
      return;
    }
    void loadItems(activeListId);
  }, [activeListId, loadItems]);

  useEffect(() => {
    if (!activeListId) return;
    return subscribeRealtime((event) => {
      if (event.listId !== activeListId) return;
      if (event.type === "list.updated") {
        void loadLists();
        return;
      }
      setItems((prev) => {
        const next = applyStreamEventToItems(prev, event);
        itemsRef.current = next;
        return next;
      });
    });
  }, [activeListId, subscribeRealtime, loadLists]);

  useEffect(() => {
    if (!isSignedIn || !activeListId) return;
    const timer = setInterval(() => {
      void shoppingListsApi.list().then(({ lists: fetched }) => {
        setLists(fetched);
        if (activeListId && !fetched.some((l) => l.id === activeListId)) {
          const nextId = fetched[0]?.id ?? null;
          setActiveListId(nextId);
          if (nextId) storeListId(nextId);
          else setItems([]);
        }
      }).catch(() => undefined);
    }, LIST_POLL_MS);
    return () => clearInterval(timer);
  }, [isSignedIn, activeListId]);

  const categoryOptions = useMemo(
    () => categorySuggestions(items.map((item) => item.category)),
    [items]
  );

  const activeItems = useMemo(() => items.filter((i) => !i.checked), [items]);
  const checkedItems = useMemo(() => items.filter((i) => i.checked), [items]);

  const grouped = useMemo(() => groupActiveItemsByCategory(activeItems), [activeItems]);
  const categoryLabels = useMemo(
    () => sortCategoryLabels([...grouped.keys()]),
    [grouped]
  );

  const handleSelectList = (listId: string) => {
    setActiveListId(listId);
    storeListId(listId);
    setSwitcherOpen(false);
  };

  const handleCreateList = async () => {
    setCreatingList(true);
    try {
      const { list } = await shoppingListsApi.create(DEFAULT_LIST_NAME);
      setLists((prev) => [...prev, list]);
      setActiveListId(list.id);
      storeListId(list.id);
      toastSuccess("List created.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to create list.");
    } finally {
      setCreatingList(false);
    }
  };

  const handleAddItem = async (values: AddItemFormValues) => {
    if (!activeListId) return;
    const category =
      values.category.trim() ||
      inferIngredientCategory(values.name) ||
      null;
    setAddingItem(true);
    try {
      const { item } = await shoppingListsApi.addItem(activeListId, {
        name: values.name,
        quantity: values.quantity.trim() || undefined,
        category,
      });
      setItems((prev) => [...prev, item]);
      itemsRef.current = [...itemsRef.current, item];
      setAddItemOpen(false);
      toastSuccess("Item added.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to add item.");
    } finally {
      setAddingItem(false);
    }
  };

  const handleSaveEdit = async (item: ShoppingListItem, draft: ItemEditDraft) => {
    if (!activeListId) return;
    setEditSaving(true);
    try {
      const { item: updated } = await shoppingListsApi.updateItem(activeListId, item.id, {
        name: draft.name,
        quantity: draft.quantity || undefined,
        note: draft.note || undefined,
        category: draft.category || undefined,
      });
      setItems((prev) => prev.map((row) => (row.id === item.id ? updated : row)));
      itemsRef.current = itemsRef.current.map((row) => (row.id === item.id ? updated : row));
      setEditingItemId(null);
      toastSuccess("Item updated.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to update item.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!activeListId || !activeList?.isOwner) return;
    if (memberUserId === activeList.ownerUserId) return;
    if (!window.confirm(`Remove ${memberName} from this list?`)) return;
    setMemberRemovingId(memberUserId);
    try {
      const { list } = await shoppingListsApi.removeMember(activeListId, memberUserId);
      setLists((prev) => prev.map((row) => (row.id === list.id ? list : row)));
      toastSuccess(`${memberName} removed from the list.`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to remove member.");
    } finally {
      setMemberRemovingId(null);
    }
  };

  const handleToggleChecked = async (item: ShoppingListItem) => {
    if (!activeListId) return;
    const nextChecked = !item.checked;
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, checked: nextChecked } : row))
    );
    try {
      await shoppingListsApi.updateItem(activeListId, item.id, { checked: nextChecked });
    } catch (err) {
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, checked: item.checked } : row))
      );
      toastError(err instanceof Error ? err.message : "Failed to update item.");
    }
  };

  const handleDeleteItem = async (item: ShoppingListItem) => {
    if (!activeListId) return;
    const prev = items;
    setItems((current) => current.filter((row) => row.id !== item.id));
    try {
      await shoppingListsApi.deleteItem(activeListId, item.id);
    } catch (err) {
      setItems(prev);
      toastError(err instanceof Error ? err.message : "Failed to remove item.");
    }
  };

  const handleClearChecked = async () => {
    if (!activeListId || checkedItems.length === 0) return;
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    try {
      await shoppingListsApi.clearChecked(activeListId);
      setItems((prev) => prev.filter((i) => !i.checked));
      setClearConfirm(false);
      toastSuccess("Checked items cleared.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to clear checked items.");
    }
  };

  const handleRenameList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListId) return;
    const name = renameName.trim();
    if (!name) return;
    setRenameSaving(true);
    try {
      const { list } = await shoppingListsApi.update(activeListId, name);
      setLists((prev) => prev.map((row) => (row.id === list.id ? list : row)));
      setRenameOpen(false);
      toastSuccess("List renamed.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to rename list.");
    } finally {
      setRenameSaving(false);
    }
  };

  const handleDeleteList = async () => {
    if (!activeListId || !activeList?.isOwner) return;
    if (!window.confirm(`Delete "${activeList.name}"? This cannot be undone.`)) return;
    setListActionSaving(true);
    try {
      await shoppingListsApi.delete(activeListId);
      const remaining = lists.filter((l) => l.id !== activeListId);
      setLists(remaining);
      const nextId = remaining[0]?.id ?? null;
      setActiveListId(nextId);
      if (nextId) storeListId(nextId);
      else clearStoredListId();
      toastSuccess("List deleted.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete list.");
    } finally {
      setListActionSaving(false);
      setOptionsOpen(false);
    }
  };

  const handleLeaveList = async () => {
    if (!activeListId || activeList?.isOwner) return;
    if (!window.confirm(`Leave "${activeList?.name}"?`)) return;
    setListActionSaving(true);
    try {
      await shoppingListsApi.leave(activeListId);
      const remaining = lists.filter((l) => l.id !== activeListId);
      setLists(remaining);
      const nextId = remaining[0]?.id ?? null;
      setActiveListId(nextId);
      if (nextId) storeListId(nextId);
      toastSuccess("Left list.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to leave list.");
    } finally {
      setListActionSaving(false);
      setOptionsOpen(false);
    }
  };

  const openShare = async () => {
    if (!activeListId) return;
    setShareOpen(true);
    setShareCode(activeList?.shareCode ?? null);
    if (activeList?.shareCode) return;
    setShareLoading(true);
    try {
      const { code } = await shoppingListsApi.generateShareCode(activeListId);
      setShareCode(code);
      setLists((prev) =>
        prev.map((l) => (l.id === activeListId ? { ...l, shareCode: code } : l))
      );
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to generate share code.");
      setShareOpen(false);
    } finally {
      setShareLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code) return;
    setJoinSaving(true);
    try {
      const { list } = await shoppingListsApi.join(code);
      setLists((prev) => {
        const exists = prev.some((l) => l.id === list.id);
        return exists ? prev.map((l) => (l.id === list.id ? list : l)) : [...prev, list];
      });
      setActiveListId(list.id);
      storeListId(list.id);
      setJoinOpen(false);
      setJoinCode("");
      toastSuccess(`Joined "${list.name}".`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to join list.");
    } finally {
      setJoinSaving(false);
    }
  };

  const openRecipePicker = async () => {
    setRecipePickerOpen(true);
    setRecipesLoading(true);
    try {
      const { recipes: list } = await recipesApi.list();
      setRecipes(list);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to load recipes.");
      setRecipePickerOpen(false);
    } finally {
      setRecipesLoading(false);
    }
  };

  const handleRecipePick = async (recipe: Recipe) => {
    if (!activeListId || recipeAdding) return;
    const bulkItems = recipe.ingredients
      .filter((ing) => !ing.isOptional)
      .map(ingredientToListItem);
    if (bulkItems.length === 0) {
      toastError("This recipe has no ingredients.");
      return;
    }

    const dupes = findDuplicateItemNames(bulkItems, items);
    if (dupes.length > 0) {
      setDupeConfirm({ names: dupes, bulkItems });
      setRecipePickerOpen(false);
      return;
    }

    setRecipeAdding(true);
    try {
      const { items: updated } = await shoppingListsApi.bulkAdd(activeListId, bulkItems);
      setItems(updated);
      itemsRef.current = updated;
      setRecipePickerOpen(false);
      toastSuccess(`Added ${bulkItems.length} items from "${recipe.title}".`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to add ingredients.");
    } finally {
      setRecipeAdding(false);
    }
  };

  const confirmDuplicateRecipeAdd = async (itemsToAdd: ReturnType<typeof ingredientToListItem>[]) => {
    if (!activeListId || itemsToAdd.length === 0) return;
    setRecipeAdding(true);
    try {
      const { items: updated } = await shoppingListsApi.bulkAdd(activeListId, itemsToAdd);
      setItems(updated);
      itemsRef.current = updated;
      setDupeConfirm(null);
      toastSuccess(`Added ${itemsToAdd.length} item${itemsToAdd.length === 1 ? "" : "s"}.`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to add ingredients.");
    } finally {
      setRecipeAdding(false);
    }
  };

  if (!isLoading && !isSignedIn) {
    return (
      <div className="shopping-list-page">
        <h1 className="shopping-list-page__title">Shopping list</h1>
        <div className="shopping-list-page__guest-overlay" aria-hidden>
          <div className="shopping-list-page__guest-center">
            <div className="shopping-list-page__guest">
              <span className="shopping-list-page__guest-icon" aria-hidden>
                <IconShoppingList />
              </span>
              <p className="shopping-list-page__guest-text">Sign in to create and share shopping lists.</p>
              <p className="shopping-list-page__guest-sub">Collaborate with housemates on shared grocery lists.</p>
              <button type="button" className="shopping-list-page__cta" onClick={() => openAuthModal("login")}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingLists && lists.length === 0) {
    return (
      <div className="shopping-list-page shopping-list-page--shell">
        <p className="shopping-list-page__loading">Loading lists…</p>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="shopping-list-page shopping-list-page--shell">
        <div className="shopping-list-page__empty-setup">
          <h1 className="shopping-list-page__title">Shopping list</h1>
          <p>Create your first list to start adding groceries.</p>
          <button type="button" className="shopping-list-page__cta" onClick={handleCreateList} disabled={creatingList}>
            {creatingList ? "Creating…" : "Create a list"}
          </button>
          <button type="button" className="shopping-list-page__link-btn" onClick={() => setJoinOpen(true)}>
            Join with a share code
          </button>
        </div>
        {joinOpen && (
          <JoinCodeModal
            value={joinCode}
            onChange={setJoinCode}
            saving={joinSaving}
            onClose={() => setJoinOpen(false)}
            onSubmit={handleJoin}
          />
        )}
      </div>
    );
  }

  return (
    <div className="shopping-list-page shopping-list-page--shell">
      <div className="shopping-list-top">
      <header className="shopping-list-header">
        <div className="shopping-list-header__top">
          <div>
            <h1 className="shopping-list-header__title">{activeList?.name ?? "Shopping list"}</h1>
            <div className="shopping-list-header__switcher-wrap" ref={switcherRef}>
              <button
                type="button"
                className="shopping-list-header__switcher"
                onClick={() => setSwitcherOpen((o) => !o)}
                aria-expanded={switcherOpen}
              >
                All lists ▾
              </button>
              {switcherOpen && (
                <div className="shopping-list-header__switcher-menu" role="menu">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      type="button"
                      role="menuitem"
                      className={`shopping-list-header__switcher-item ${list.id === activeListId ? "shopping-list-header__switcher-item--active" : ""}`}
                      onClick={() => handleSelectList(list.id)}
                    >
                      {list.name}
                    </button>
                  ))}
                  <button type="button" role="menuitem" className="shopping-list-header__switcher-item" onClick={handleCreateList} disabled={creatingList}>
                    + New list
                  </button>
                  <button type="button" role="menuitem" className="shopping-list-header__switcher-item" onClick={() => { setSwitcherOpen(false); setJoinOpen(true); }}>
                    Join with code
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="shopping-list-header__options-wrap" ref={optionsRef}>
            <button
              type="button"
              className="shopping-list-header__options-btn"
              onClick={() => setOptionsOpen((o) => !o)}
              aria-expanded={optionsOpen}
              aria-label="List options"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <circle cx="5" cy="12" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="19" cy="12" r="1.75" />
              </svg>
            </button>
            {optionsOpen && (
              <div className="shopping-list-header__options-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="shopping-list-header__options-item"
                  onClick={() => {
                    setOptionsOpen(false);
                    setRenameName(activeList?.name ?? "");
                    setRenameOpen(true);
                  }}
                >
                  Rename list
                </button>
                {activeList?.isOwner ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="shopping-list-header__options-item shopping-list-header__options-item--danger"
                    onClick={handleDeleteList}
                    disabled={listActionSaving}
                  >
                    Delete list
                  </button>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    className="shopping-list-header__options-item"
                    onClick={handleLeaveList}
                    disabled={listActionSaving}
                  >
                    Leave list
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {activeList && (
          <div className="shopping-list-header__members">
            {activeList.members.map((member) => (
              <span key={member.id} className="shopping-list-header__member">
                <span
                  className="shopping-list-header__avatar shopping-list-header__avatar--member"
                  data-tooltip={member.name}
                  aria-label={member.name}
                >
                  {member.initial}
                </span>
                {activeList.isOwner && member.id !== activeList.ownerUserId && (
                  <button
                    type="button"
                    className="shopping-list-header__member-remove"
                    onClick={() => void handleRemoveMember(member.id, member.name)}
                    disabled={memberRemovingId === member.id}
                    aria-label={`Remove ${member.name}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            <button
              type="button"
              className="shopping-list-header__avatar shopping-list-header__avatar--add"
              onClick={openShare}
              aria-label="Share list to add members"
            >
              +
            </button>
          </div>
        )}
      </header>

      <div className="shopping-list-add-trigger">
        <button
          type="button"
          className="shopping-list-add-trigger__btn"
          onClick={() => setAddItemOpen(true)}
          disabled={addingItem || !activeListId}
        >
          Add item
        </button>
      </div>
      </div>

      <div className="shopping-list-content">
        {loadingItems && items.length === 0 ? (
          <p className="shopping-list-page__loading">Loading items…</p>
        ) : activeItems.length === 0 && checkedItems.length === 0 ? (
          <div className="shopping-list-page__empty">
            <p>Your list is empty.</p>
            <p>Add items with the button above or pull ingredients from a recipe.</p>
          </div>
        ) : (
          <>
            {categoryLabels.map((label) => {
              const rows = grouped.get(label) ?? [];
              return (
                <section key={label} className="shopping-list-category">
                  <h2 className="shopping-list-category__label">{label}</h2>
                  <ul className="shopping-list-category__items">
                    {rows.map((item) => (
                      <ShoppingListItemRow
                        key={item.id}
                        item={item}
                        editing={editingItemId === item.id}
                        saving={editSaving && editingItemId === item.id}
                        onToggleChecked={() => void handleToggleChecked(item)}
                        onDelete={() => void handleDeleteItem(item)}
                        onStartEdit={() => setEditingItemId(item.id)}
                        onCancelEdit={() => setEditingItemId(null)}
                        onSaveEdit={(draft) => void handleSaveEdit(item, draft)}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}

            {checkedItems.length > 0 && (
              <section className="shopping-list-checked">
                <div className="shopping-list-checked__header">
                  <button
                    type="button"
                    className="shopping-list-checked__toggle"
                    onClick={() => setCheckedOpen((o) => !o)}
                    aria-expanded={checkedOpen}
                  >
                    Checked ({checkedItems.length})
                  </button>
                  <button
                    type="button"
                    className={`shopping-list-checked__clear ${clearConfirm ? "shopping-list-checked__clear--confirm" : ""}`}
                    onClick={() => void handleClearChecked()}
                  >
                    {clearConfirm ? "Confirm clear" : "Clear checked"}
                  </button>
                </div>
                {checkedOpen && (
                  <ul className="shopping-list-category__items">
                    {checkedItems.map((item) => (
                      <ShoppingListItemRow
                        key={item.id}
                        item={item}
                        checked
                        editing={editingItemId === item.id}
                        saving={editSaving && editingItemId === item.id}
                        onToggleChecked={() => void handleToggleChecked(item)}
                        onDelete={() => void handleDeleteItem(item)}
                        onStartEdit={() => setEditingItemId(item.id)}
                        onCancelEdit={() => setEditingItemId(null)}
                        onSaveEdit={(draft) => void handleSaveEdit(item, draft)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <footer className="shopping-list-bottom-bar">
        <button type="button" className="shopping-list-bottom-bar__btn" onClick={openRecipePicker}>
          From recipe
        </button>
        <button type="button" className="shopping-list-bottom-bar__btn shopping-list-bottom-bar__btn--primary" onClick={openShare}>
          Share list
        </button>
      </footer>

      {shareOpen && (
        <ShareCodeModal
          code={shareCode}
          shareUrl={shareUrl}
          loading={shareLoading}
          onClose={() => setShareOpen(false)}
        />
      )}
      {joinOpen && (
        <JoinCodeModal
          value={joinCode}
          onChange={setJoinCode}
          saving={joinSaving}
          onClose={() => setJoinOpen(false)}
          onSubmit={handleJoin}
        />
      )}
      {recipePickerOpen && (
        <RecipePickerModal
          recipes={recipes}
          loading={recipesLoading || recipeAdding}
          onClose={() => !recipeAdding && setRecipePickerOpen(false)}
          onPick={(recipe) => void handleRecipePick(recipe)}
        />
      )}
      {addItemOpen && (
        <AddItemModal
          categoryOptions={categoryOptions}
          saving={addingItem}
          onClose={() => !addingItem && setAddItemOpen(false)}
          onSubmit={(values) => void handleAddItem(values)}
        />
      )}
      {dupeConfirm && (
        <DuplicateItemsModal
          names={dupeConfirm.names}
          listName={activeList?.name ?? "Shopping list"}
          missingCount={filterNonDuplicateItems(dupeConfirm.bulkItems, items).length}
          saving={recipeAdding}
          onCancel={() => setDupeConfirm(null)}
          onAddMissing={() => {
            const missing = filterNonDuplicateItems(dupeConfirm.bulkItems, items);
            void confirmDuplicateRecipeAdd(missing);
          }}
          onConfirm={() => void confirmDuplicateRecipeAdd(dupeConfirm.bulkItems)}
        />
      )}
      {renameOpen && (
        <div className="shopping-list-modal-overlay" onClick={() => !renameSaving && setRenameOpen(false)} role="dialog" aria-modal="true">
          <div className="shopping-list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shopping-list-modal__header">
              <h2>Rename list</h2>
              <button type="button" className="shopping-list-modal__close" onClick={() => setRenameOpen(false)} aria-label="Close" disabled={renameSaving}>
                <span aria-hidden>&times;</span>
              </button>
            </div>
            <form onSubmit={handleRenameList}>
              <div className="shopping-list-modal__body">
                <label className="shopping-list-modal__field">
                  <span>List name</span>
                  <input
                    type="text"
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    required
                    disabled={renameSaving}
                    autoFocus
                  />
                </label>
              </div>
              <div className="shopping-list-modal__actions">
                <button type="button" className="shopping-list-modal__cancel" onClick={() => setRenameOpen(false)} disabled={renameSaving}>
                  Cancel
                </button>
                <button type="submit" className="shopping-list-modal__submit" disabled={renameSaving || !renameName.trim()}>
                  {renameSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
