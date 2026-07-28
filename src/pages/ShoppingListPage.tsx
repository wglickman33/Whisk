import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  itemNameSuggestions,
  sortCategoryLabels,
  getStoredListId,
  storeListId,
  clearStoredListId,
  ingredientToListItem,
} from "../utils/shoppingListUtils";
import { DEFAULT_LIST_NAME } from "../utils/shoppingListActions";
import { useClickOutside } from "../components/shopping/ListPickerModal";
import { IconShoppingList } from "../components/ui/SidebarIcons";
import "./ShoppingListPage.scss";

const POLL_MS = 5000;
const LIST_POLL_MS = 30000;

function ShareCodeModal({
  code,
  loading,
  onClose,
}: {
  code: string | null;
  loading: boolean;
  onClose: () => void;
}) {
  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toastSuccess("Share code copied.");
    } catch {
      toastError("Could not copy code.");
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
            Share this code with someone who already has a Whisk account. They can join instantly.
          </p>
          {loading ? (
            <p className="shopping-list-modal__loading">Generating code…</p>
          ) : (
            <div className="shopping-list-modal__code-row">
              <code className="shopping-list-modal__code">{code}</code>
              <button type="button" className="shopping-list-modal__copy" onClick={copy} disabled={!code}>
                Copy
              </button>
            </div>
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
            <ul className="shopping-list-recipe-picker">
              {recipes.map((recipe) => (
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
        </div>
      </div>
    </div>
  );
}

export function ShoppingListPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [quickAdd, setQuickAdd] = useState("");
  const [addingItem, setAddingItem] = useState(false);
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
  const switcherRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const activeList = lists.find((l) => l.id === activeListId) ?? null;

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
    void loadLists();
  }, [isSignedIn, loadLists]);

  useEffect(() => {
    if (!activeListId) {
      setItems([]);
      return;
    }
    void loadItems(activeListId);
  }, [activeListId, loadItems]);

  useEffect(() => {
    if (!isSignedIn || !activeListId) return;
    const timer = setInterval(() => {
      void loadItems(activeListId, true);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [isSignedIn, activeListId, loadItems]);

  useEffect(() => {
    if (!isSignedIn) return;
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

  const pastNames = useMemo(
    () => items.map((item) => item.name),
    [items]
  );

  const suggestions = useMemo(
    () => itemNameSuggestions(pastNames, quickAdd),
    [pastNames, quickAdd]
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

  const handleQuickAdd = async (nameOverride?: string) => {
    const name = (nameOverride ?? quickAdd).trim();
    if (!name || !activeListId) return;
    setAddingItem(true);
    try {
      const { item } = await shoppingListsApi.addItem(activeListId, { name });
      setItems((prev) => [...prev, item]);
      setQuickAdd("");
      toastSuccess("Item added.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to add item.");
    } finally {
      setAddingItem(false);
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
    const bulkItems = recipe.ingredients.map(ingredientToListItem);
    if (bulkItems.length === 0) {
      toastError("This recipe has no ingredients.");
      return;
    }
    setRecipeAdding(true);
    try {
      const { items: updated } = await shoppingListsApi.bulkAdd(activeListId, bulkItems);
      setItems(updated);
      setRecipePickerOpen(false);
      toastSuccess(`Added ${bulkItems.length} items from "${recipe.title}".`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to add ingredients.");
    } finally {
      setRecipeAdding(false);
    }
  };

  if (!isSignedIn) {
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
              <p className="shopping-list-page__guest-sub">Collaborate with housemates — check off items in real time.</p>
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
              ⋯
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
              <span key={member.id} className="shopping-list-header__avatar" title={member.name}>
                {member.initial}
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

      <div className="shopping-list-quick-add">
        <form
          className="shopping-list-quick-add__field"
          onSubmit={(e) => {
            e.preventDefault();
            void handleQuickAdd();
          }}
        >
          <span className="shopping-list-quick-add__icon" aria-hidden>
            +
          </span>
          <input
            type="text"
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            placeholder="Add an item…"
            aria-label="Add an item"
            disabled={addingItem || !activeListId}
          />
        </form>
        {suggestions.length > 0 && (
          <div className="shopping-list-quick-add__suggestions">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                className="shopping-list-quick-add__chip"
                onClick={() => void handleQuickAdd(name)}
                disabled={addingItem}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="shopping-list-content">
        {loadingItems && items.length === 0 ? (
          <p className="shopping-list-page__loading">Loading items…</p>
        ) : activeItems.length === 0 && checkedItems.length === 0 ? (
          <div className="shopping-list-page__empty">
            <p>Your list is empty.</p>
            <p>Add items above or pull ingredients from a recipe.</p>
          </div>
        ) : (
          <>
            {categoryLabels.map((label) => {
              const rows = grouped.get(label) ?? [];
              return (
                <section key={label} className="shopping-list-category">
                  <h2 className="shopping-list-category__label">{label}</h2>
                  <ul className="shopping-list-category__items">
                    {(rows).map((item) => (
                      <li key={item.id} className="shopping-list-item">
                        <button
                          type="button"
                          className="shopping-list-item__check"
                          onClick={() => void handleToggleChecked(item)}
                          aria-label={`Mark ${item.name} as done`}
                        />
                        <div className="shopping-list-item__body">
                          <div className="shopping-list-item__name">{item.name}</div>
                          {(item.quantity || item.note) && (
                            <div className="shopping-list-item__meta">
                              {item.quantity && <span className="shopping-list-item__qty">{item.quantity}</span>}
                              {item.note && <span className="shopping-list-item__note">{item.note}</span>}
                            </div>
                          )}
                        </div>
                        <span className="shopping-list-item__added-by">{item.addedByName}</span>
                        <button
                          type="button"
                          className="shopping-list-item__remove"
                          onClick={() => void handleDeleteItem(item)}
                          aria-label={`Remove ${item.name}`}
                        >
                          ×
                        </button>
                      </li>
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
                      <li key={item.id} className="shopping-list-item shopping-list-item--checked">
                        <button
                          type="button"
                          className="shopping-list-item__check shopping-list-item__check--done"
                          onClick={() => void handleToggleChecked(item)}
                          aria-label={`Uncheck ${item.name}`}
                        >
                          ✓
                        </button>
                        <div className="shopping-list-item__body">
                          <div className="shopping-list-item__name">{item.name}</div>
                        </div>
                        <span className="shopping-list-item__added-by">{item.addedByName}</span>
                        <button
                          type="button"
                          className="shopping-list-item__remove"
                          onClick={() => void handleDeleteItem(item)}
                          aria-label={`Remove ${item.name}`}
                        >
                          ×
                        </button>
                      </li>
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
        <ShareCodeModal code={shareCode} loading={shareLoading} onClose={() => setShareOpen(false)} />
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
