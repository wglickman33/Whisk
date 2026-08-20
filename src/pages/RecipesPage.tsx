import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { useAuthModalStore } from "../store/authModalStore";
import {
  recipesApi,
  foldersApi,
  tagsApi,
  shoppingListsApi,
  type Recipe,
  type RecipeInput,
  type FolderSummary,
  type Tag,
  type ShoppingList,
  type ShoppingListItemInput,
  type ShoppingListItem,
} from "../api/client";
import { toastSuccess, toastError } from "../store/toastStore";
import { filterRecipes } from "../utils/filterRecipes";
import { scaledIngredientToListItem } from "../utils/shoppingListUtils";
import { bulkAddToList, resolveAddTarget } from "../utils/shoppingListActions";
import { SHOPPING_LIST_PATH } from "../utils/shoppingListShare";
import { importRecipeFromFile } from "../utils/recipeTransfer";
import {
  isRecipePhotoFile,
  recipePhotoToDataUrl,
  recipePhotoMaxBytesForCount,
  prepareRecipePhotoFile,
  reorderRecipePhotos,
  RECIPE_PHOTO_MAX_COUNT,
} from "../utils/recipeImage";
import { RecipePhotoStaging, type StagedRecipePhoto } from "../components/recipes/RecipePhotoStaging";
import { findDuplicateItemNames, filterNonDuplicateItems } from "../utils/shoppingListDedupe";
import { matchRecipeImportTags } from "../utils/recipeImportTags";
import { DuplicateItemsModal } from "../components/shopping/DuplicateItemsModal";
import { ListPickerModal } from "../components/shopping/ListPickerModal";
import { RecipeExportMenu } from "../components/recipes/RecipeExportMenu";
import { IconRecipe } from "../components/ui/SidebarIcons";
import { RecipeView } from "../components/recipes/RecipeView";
import "./RecipesPage.scss";

export function RecipesPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState<string>("");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importingFile, setImportingFile] = useState(false);
  const [importingPhoto, setImportingPhoto] = useState(false);
  const [stagedPhotos, setStagedPhotos] = useState<StagedRecipePhoto[]>([]);
  const stagedPhotosRef = useRef<StagedRecipePhoto[]>([]);
  const importFileRef = useRef<HTMLInputElement>(null);
  const importPhotoRef = useRef<HTMLInputElement>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importDraft, setImportDraft] = useState<RecipeInput | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderSaving, setFolderSaving] = useState(false);
  const [listPickerOpen, setListPickerOpen] = useState(false);
  const [listPickerLists, setListPickerLists] = useState<ShoppingList[]>([]);
  const [listPickerItems, setListPickerItems] = useState<ShoppingListItemInput[]>([]);
  const [listPickerSaving, setListPickerSaving] = useState(false);
  const [dupeConfirm, setDupeConfirm] = useState<{
    names: string[];
    items: ShoppingListItemInput[];
    existing: ShoppingListItem[];
    listId: string;
    listName: string;
  } | null>(null);
  const [dupeSaving, setDupeSaving] = useState(false);

  const fetchRecipes = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const [{ recipes: list }, { folders: folderList }, { tags }] = await Promise.all([
        recipesApi.list(),
        foldersApi.list(),
        tagsApi.list(),
      ]);
      setRecipes(list);
      setFolders(folderList);
      setAllTags(tags);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    stagedPhotosRef.current = stagedPhotos;
  }, [stagedPhotos]);

  useEffect(() => {
    return () => {
      stagedPhotosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, []);

  const visibleRecipes = useMemo(
    () => filterRecipes(recipes, search, folderFilter || null),
    [recipes, search, folderFilter]
  );

  const finishAddToList = useCallback(
    async (listId: string, listName: string, items: ShoppingListItemInput[]) => {
      await bulkAddToList(listId, items);
      toastSuccess(`Added to "${listName}".`, {
        actionLabel: "View list",
        actionHref: SHOPPING_LIST_PATH,
      });
    },
    []
  );

  const tryAddItemsToShoppingList = useCallback(
    async (items: ShoppingListItemInput[]) => {
      try {
        const target = await resolveAddTarget(items);
        if (target.status === "empty") return;
        if (target.status === "pick") {
          setListPickerLists(target.lists);
          setListPickerItems(target.items);
          setListPickerOpen(true);
          return;
        }

        const { items: existing } = await shoppingListsApi.getItems(target.listId);
        const dupes = findDuplicateItemNames(items, existing);
        if (dupes.length > 0) {
          setDupeConfirm({
            names: dupes,
            items,
            existing,
            listId: target.listId,
            listName: target.listName,
          });
          return;
        }

        await finishAddToList(target.listId, target.listName, items);
      } catch (err) {
        toastError(err instanceof Error ? err.message : "Failed to add to shopping list.");
      }
    },
    [finishAddToList]
  );

  const addIngredientsToShoppingList = useCallback(
    async (items: ShoppingListItemInput[]) => {
      await tryAddItemsToShoppingList(items);
    },
    [tryAddItemsToShoppingList]
  );

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    try {
      const recipe = await recipesApi.importUrl(url);
      setRecipes((prev) => [recipe, ...prev]);
      setImportUrl("");
      toastSuccess(`Imported "${recipe.title}".`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportingFile(true);
    try {
      const recipe = await importRecipeFromFile(file);
      setRecipes((prev) => [recipe, ...prev]);
      setAllTags((prev) => {
        const merged = new Map(prev.map((tag) => [tag.id, tag]));
        for (const { tag } of recipe.tags ?? []) merged.set(tag.id, tag);
        return [...merged.values()].sort((a, b) => a.label.localeCompare(b.label));
      });
      toastSuccess(`Imported "${recipe.title}".`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to import recipe file.");
    } finally {
      setImportingFile(false);
    }
  };

  const clearStagedPhotos = useCallback(() => {
    setStagedPhotos((prev) => {
      prev.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      return [];
    });
  }, []);

  const handleStagePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    if (files.length === 0) return;
    const remaining = RECIPE_PHOTO_MAX_COUNT - stagedPhotos.length;
    if (remaining <= 0) {
      toastError(`Use up to ${RECIPE_PHOTO_MAX_COUNT} photos for one recipe.`);
      return;
    }
    const selected = files.slice(0, remaining);
    if (files.length > remaining) {
      toastError(`Use up to ${RECIPE_PHOTO_MAX_COUNT} photos for one recipe.`);
    }
    if (selected.some((file) => !isRecipePhotoFile(file))) {
      toastError("Use JPEG, PNG, WebP, or HEIC photos.");
      return;
    }
    try {
      const added: StagedRecipePhoto[] = [];
      for (const file of selected) {
        const prepared = await prepareRecipePhotoFile(file);
        added.push({
          id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
          file: prepared,
          previewUrl: URL.createObjectURL(prepared),
        });
      }
      setStagedPhotos((prev) => {
        const room = RECIPE_PHOTO_MAX_COUNT - prev.length;
        const keep = added.slice(0, room);
        added.slice(room).forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
        return [...prev, ...keep];
      });
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not add those photos.");
    }
  };

  const handleReadStagedPhotos = async () => {
    if (stagedPhotos.length === 0 || importingPhoto) return;
    setImportingPhoto(true);
    try {
      const maxBytes = recipePhotoMaxBytesForCount(stagedPhotos.length);
      const images: string[] = [];
      for (const photo of stagedPhotos) {
        images.push(await recipePhotoToDataUrl(photo.file, { maxBytes }));
      }
      const { recipe } = await recipesApi.importImage(images);
      clearStagedPhotos();
      setEditingId(null);
      setImportDraft(recipe);
      setFormOpen(true);
      toastSuccess("Check the details, then save.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not read those recipe photos.");
    } finally {
      setImportingPhoto(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    setFolderSaving(true);
    try {
      const folder = await foldersApi.create(name);
      setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
      setFolderModalOpen(false);
      setFolderName("");
      toastSuccess("Folder created.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not create folder.");
    } finally {
      setFolderSaving(false);
    }
  };

  const openFolderModal = () => {
    setFolderName("");
    setFolderModalOpen(true);
  };

  const closeFolderModal = () => {
    if (folderSaving) return;
    setFolderModalOpen(false);
    setFolderName("");
  };

  if (!isLoading && !isSignedIn) {
    return (
      <div className="recipes-page">
        <h1 className="recipes-page__title">Recipes</h1>
        <div className="recipes-page__guest-overlay" aria-hidden>
          <div className="recipes-page__guest-center">
            <div className="recipes-page__guest">
              <span className="recipes-page__guest-icon" aria-hidden>
                <IconRecipe />
              </span>
              <p className="recipes-page__guest-text">Sign in to save and manage your recipes.</p>
              <p className="recipes-page__guest-sub">Your recipes stay private and sync across devices.</p>
              <button type="button" className="recipes-page__cta" onClick={() => openAuthModal("login")}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recipes-page">
      <header className="recipes-page__header">
        <h1 className="recipes-page__title">Recipes</h1>
        <button
          type="button"
          className="recipes-page__new"
          onClick={() => {
            setEditingId(null);
            setImportDraft(null);
            setFormOpen(true);
          }}
        >
          New Recipe
        </button>
      </header>

      <div className="recipes-page__toolbar">
        <input
          type="search"
          className="recipes-page__search"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search recipes"
        />
        <select
          className="recipes-page__folder-filter"
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          aria-label="Filter by folder"
        >
          <option value="">All folders</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button type="button" className="recipes-page__folder-btn" onClick={openFolderModal}>
          + Folder
        </button>
      </div>

      <div className="recipes-page__import-row">
        <form className="recipes-page__import" onSubmit={handleImport}>
          <input
            type="url"
            placeholder="Paste recipe URL to import…"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            aria-label="Recipe URL"
          />
          <button type="submit" disabled={importing || !importUrl.trim()}>
            {importing ? "Importing…" : "Import URL"}
          </button>
        </form>
        <div className="recipes-page__import-file">
          <input
            ref={importFileRef}
            type="file"
            accept=".json,.whisk.json,application/json"
            className="recipes-page__import-file-input"
            onChange={(e) => void handleImportFile(e)}
            aria-label="Import Whisk recipe file"
          />
          <button
            type="button"
            className="recipes-page__import-file-btn"
            onClick={() => importFileRef.current?.click()}
            disabled={importingFile || importingPhoto}
          >
            {importingFile ? "Importing…" : "Import file"}
          </button>
        </div>
        <div className="recipes-page__import-file">
          <input
            ref={importPhotoRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
            className="recipes-page__import-file-input"
            onChange={(e) => void handleStagePhotos(e)}
            aria-label="Add recipe photos"
          />
          <button
            type="button"
            className="recipes-page__import-file-btn"
            onClick={() => importPhotoRef.current?.click()}
            disabled={importingPhoto || importingFile || stagedPhotos.length >= RECIPE_PHOTO_MAX_COUNT}
            title="Select up to 5 screenshots in page order"
          >
            {stagedPhotos.length > 0 ? "Add photos" : "Import photos"}
          </button>
        </div>
      </div>

      {stagedPhotos.length > 0 && (
        <RecipePhotoStaging
          photos={stagedPhotos}
          importing={importingPhoto}
          onMove={(from, to) => setStagedPhotos((prev) => reorderRecipePhotos(prev, from, to))}
          onRemove={(id) => {
            setStagedPhotos((prev) => {
              const removed = prev.find((photo) => photo.id === id);
              if (removed) URL.revokeObjectURL(removed.previewUrl);
              return prev.filter((photo) => photo.id !== id);
            });
          }}
          onAdd={() => importPhotoRef.current?.click()}
          onCancel={clearStagedPhotos}
          onRead={() => void handleReadStagedPhotos()}
        />
      )}

      <div className="recipes-page__body">
        {loading && <p className="recipes-page__loading">Loading recipes…</p>}

        {!loading && visibleRecipes.length === 0 && !formOpen && (
          <p className="recipes-page__empty">
            {recipes.length === 0
              ? 'No recipes yet. Click "New Recipe", import a URL, a Whisk file, or photos.'
              : "No recipes match your search."}
          </p>
        )}

        {!loading && visibleRecipes.length > 0 && (
          <ul className="recipes-page__list">
            {visibleRecipes.map((r) => (
              <li key={r.id} className="recipes-page__card">
                <div
                  className="recipes-page__card-body"
                  onClick={() => setViewingId(r.id)}
                  onKeyDown={(e) => e.key === "Enter" && setViewingId(r.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${r.title}`}
                >
                  <h2 className="recipes-page__card-title">{r.title}</h2>
                  {r.description && <p className="recipes-page__card-desc">{r.description}</p>}
                  <div className="recipes-page__card-meta-row">
                    <span className="recipes-page__card-meta">
                      {r.servings} {r.servingUnit}
                    </span>
                    {r.folder && (
                      <span className="recipes-page__card-folder">{r.folder.name}</span>
                    )}
                  </div>
                  {r.tags && r.tags.length > 0 && (
                    <div className="recipes-page__card-tags">
                      {r.tags.map(({ tag }) => (
                        <span key={tag.id} className="recipes-page__tag">
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="recipes-page__card-actions">
                  <button type="button" className="recipes-page__card-btn recipes-page__card-btn--view" onClick={() => setViewingId(r.id)}>
                    View
                  </button>
                  <RecipeExportMenu recipe={r} variant="card" dropdownAlign="left" />
                  <button
                    type="button"
                    className="recipes-page__card-btn"
                    onClick={() => {
                      setImportDraft(null);
                      setEditingId(r.id);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="recipes-page__card-btn recipes-page__card-btn--danger" onClick={() => setDeleteConfirm(r.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {formOpen && (
        <RecipeForm
          recipe={editingId ? recipes.find((r) => r.id === editingId) ?? null : null}
          draft={editingId ? null : importDraft}
          folders={folders}
          allTags={allTags}
          onClose={() => {
            setFormOpen(false);
            setEditingId(null);
            setImportDraft(null);
          }}
          onTagsChanged={setAllTags}
          onSaved={(recipe, isUpdate) => {
            setFormOpen(false);
            setEditingId(null);
            setImportDraft(null);
            toastSuccess(isUpdate ? "Recipe updated." : "Recipe saved.");
            setRecipes((prev) => {
              const idx = prev.findIndex((r) => r.id === recipe.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = recipe;
                return next;
              }
              return [recipe, ...prev];
            });
          }}
        />
      )}

      {viewingId && (() => {
        const recipe = recipes.find((r) => r.id === viewingId);
        if (!recipe) return null;
        return (
          <RecipeView
            recipe={recipe}
            onClose={() => setViewingId(null)}
            onEdit={() => {
              setViewingId(null);
              setImportDraft(null);
              setEditingId(recipe.id);
              setFormOpen(true);
            }}
            onAddAllToList={(currentServings) => {
              const scale = recipe.servings > 0 ? currentServings / recipe.servings : 1;
              const items = recipe.ingredients
                .filter((ing) => !ing.isOptional)
                .map((ing) =>
                scaledIngredientToListItem({
                  name: ing.name,
                  quantity: ing.quantity * scale,
                  unit: ing.unit,
                  notes: ing.notes,
                })
              );
              void addIngredientsToShoppingList(items);
            }}
            onAddSelectedToList={(items) => {
              void addIngredientsToShoppingList(items.map(scaledIngredientToListItem));
            }}
          />
        );
      })()}

      {folderModalOpen && (
        <NamePromptModal
          id="folder-prompt"
          title="New folder"
          label="Folder name"
          placeholder="e.g. Weeknight dinners"
          submitLabel="Create folder"
          value={folderName}
          onChange={setFolderName}
          onClose={closeFolderModal}
          onSubmit={handleCreateFolder}
          saving={folderSaving}
        />
      )}

      {listPickerOpen && (
        <ListPickerModal
          lists={listPickerLists}
          saving={listPickerSaving}
          onClose={() => setListPickerOpen(false)}
          onSelect={(listId) => {
            setListPickerSaving(true);
            void (async () => {
              try {
                const chosen = listPickerLists.find((l) => l.id === listId);
                if (!chosen) return;
                const { items: existing } = await shoppingListsApi.getItems(listId);
                const dupes = findDuplicateItemNames(listPickerItems, existing);
                if (dupes.length > 0) {
                  setListPickerOpen(false);
                  setDupeConfirm({
                    names: dupes,
                    items: listPickerItems,
                    existing,
                    listId,
                    listName: chosen.name,
                  });
                  return;
                }
                await finishAddToList(listId, chosen.name, listPickerItems);
                setListPickerOpen(false);
              } catch (err) {
                toastError(err instanceof Error ? err.message : "Failed to add items.");
              } finally {
                setListPickerSaving(false);
              }
            })();
          }}
          onCreate={() => {
            setListPickerSaving(true);
            void (async () => {
              try {
                const { list } = await shoppingListsApi.create("Shopping list");
                await finishAddToList(list.id, list.name, listPickerItems);
                setListPickerOpen(false);
              } catch (err) {
                toastError(err instanceof Error ? err.message : "Failed to add items.");
              } finally {
                setListPickerSaving(false);
              }
            })();
          }}
        />
      )}

      {dupeConfirm && (
        <DuplicateItemsModal
          names={dupeConfirm.names}
          listName={dupeConfirm.listName}
          missingCount={filterNonDuplicateItems(dupeConfirm.items, dupeConfirm.existing).length}
          saving={dupeSaving}
          onCancel={() => setDupeConfirm(null)}
          onAddMissing={() => {
            const missing = filterNonDuplicateItems(dupeConfirm.items, dupeConfirm.existing);
            if (missing.length === 0) {
              setDupeConfirm(null);
              return;
            }
            setDupeSaving(true);
            void finishAddToList(dupeConfirm.listId, dupeConfirm.listName, missing)
              .then(() => setDupeConfirm(null))
              .catch((err) => {
                toastError(err instanceof Error ? err.message : "Failed to add items.");
              })
              .finally(() => setDupeSaving(false));
          }}
          onConfirm={() => {
            setDupeSaving(true);
            void finishAddToList(dupeConfirm.listId, dupeConfirm.listName, dupeConfirm.items)
              .then(() => setDupeConfirm(null))
              .catch((err) => {
                toastError(err instanceof Error ? err.message : "Failed to add items.");
              })
              .finally(() => setDupeSaving(false));
          }}
        />
      )}

      {deleteConfirm && (() => {
        const recipe = recipes.find((r) => r.id === deleteConfirm);
        if (!recipe) return null;
        return (
          <div className="recipes-form-overlay" onClick={() => setDeleteConfirm(null)} role="dialog" aria-modal="true">
            <div className="recipes-form recipes-form--confirm" onClick={(e) => e.stopPropagation()}>
              <div className="recipes-form__header">
                <h2>Delete recipe?</h2>
                <button type="button" className="recipes-form__close" onClick={() => setDeleteConfirm(null)} aria-label="Close">
                  <span className="recipes-form__close-icon" aria-hidden>×</span>
                </button>
              </div>
              <div className="recipes-form__body">
                <p className="recipes-form__confirm-msg">
                  Delete <strong>{recipe.title}</strong>? This cannot be undone.
                </p>
              </div>
              <div className="recipes-form__actions recipes-form__actions--footer">
                <button type="button" className="recipes-form__cancel" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="recipes-form__save recipes-form__save--danger"
                  onClick={async () => {
                    try {
                      await recipesApi.delete(recipe.id);
                      setRecipes((prev) => prev.filter((x) => x.id !== recipe.id));
                      setDeleteConfirm(null);
                      toastSuccess("Recipe deleted.");
                    } catch {
                      toastError("Failed to delete recipe.");
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

interface RecipeFormProps {
  recipe: Recipe | null;
  draft?: RecipeInput | null;
  folders: FolderSummary[];
  allTags: Tag[];
  onClose: () => void;
  onSaved: (recipe: Recipe, isUpdate?: boolean) => void;
  onTagsChanged: (tags: Tag[]) => void;
}

function RecipeForm({ recipe, draft, folders, allTags, onClose, onSaved, onTagsChanged }: RecipeFormProps) {
  const importTags = recipe
    ? { matchedIds: recipe.tags?.map((t) => t.tag.id) ?? [], pendingLabels: [] as string[] }
    : matchRecipeImportTags(allTags, draft?.tagLabels);
  const [title, setTitle] = useState(recipe?.title ?? draft?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? draft?.description ?? "");
  const [servings, setServings] = useState(recipe?.servings ?? draft?.servings ?? 4);
  const [servingUnit, setServingUnit] = useState(recipe?.servingUnit ?? draft?.servingUnit ?? "Servings");
  const [folderId, setFolderId] = useState(recipe?.folderId ?? recipe?.folder?.id ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(importTags.matchedIds);
  const [pendingTagLabels, setPendingTagLabels] = useState<string[]>(importTags.pendingLabels);
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients.length
      ? recipe.ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          notes: i.notes ?? "",
          isOptional: i.isOptional,
        }))
      : draft?.ingredients?.length
        ? draft.ingredients.map((i) => ({
            name: i.name,
            quantity: i.quantity ?? 0,
            unit: i.unit ?? "",
            notes: i.notes ?? "",
            isOptional: Boolean(i.isOptional),
          }))
        : [{ name: "", quantity: 0, unit: "", notes: "", isOptional: false }]
  );
  const [steps, setSteps] = useState(
    recipe?.steps.length
      ? recipe.steps.map((s) => ({ instruction: s.instruction, timerMinutes: s.timerMinutes }))
      : draft?.steps?.length
        ? draft.steps.map((s) => ({
            instruction: s.instruction,
            timerMinutes: s.timerMinutes ?? null,
          }))
        : [{ instruction: "", timerMinutes: null as number | null }]
  );
  const [saving, setSaving] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagSaving, setTagSaving] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = tagName.trim();
    if (!label) return;
    setTagSaving(true);
    try {
      const tag = await tagsApi.create(label);
      onTagsChanged([...allTags, tag].sort((a, b) => a.label.localeCompare(b.label)));
      setSelectedTagIds((prev) => [...prev, tag.id]);
      setTagModalOpen(false);
      setTagName("");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not create tag.");
    } finally {
      setTagSaving(false);
    }
  };

  const openTagModal = () => {
    setTagName("");
    setTagModalOpen(true);
  };

  const closeTagModal = () => {
    if (tagSaving) return;
    setTagModalOpen(false);
    setTagName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toastError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const body: RecipeInput = {
        title: title.trim(),
        description: description.trim() || null,
        servings: Number(servings) || 4,
        servingUnit: servingUnit.trim() || "Servings",
        folderId: folderId || null,
        ingredients: ingredients
          .filter((i) => i.name.trim())
          .map((i) => ({
            name: i.name.trim(),
            quantity: Number(i.quantity) || 0,
            unit: (i.unit || "").trim(),
            notes: (i.notes || "").trim() || null,
            isOptional: Boolean(i.isOptional),
          })),
        steps: steps
          .filter((s) => s.instruction.trim())
          .map((s) => {
            const mins = s.timerMinutes != null ? Number(s.timerMinutes) : null;
            return {
              instruction: s.instruction.trim(),
              timerMinutes: mins != null && mins > 0 ? mins : null,
            };
          }),
      };

      let tagIds = [...selectedTagIds];
      if (pendingTagLabels.length) {
        const created: Tag[] = [];
        for (const label of pendingTagLabels) {
          created.push(await tagsApi.create(label));
        }
        tagIds = [...tagIds, ...created.map((tag) => tag.id)];
        onTagsChanged([...allTags, ...created].sort((a, b) => a.label.localeCompare(b.label)));
      }

      let saved: Recipe;
      if (recipe) {
        saved = await recipesApi.update(recipe.id, body);
        const { tags } = await tagsApi.setRecipeTags(recipe.id, tagIds);
        onSaved({ ...saved, tags: tags.map((tag) => ({ tag })) }, true);
      } else {
        saved = await recipesApi.create(body);
        const { tags } = await tagsApi.setRecipeTags(saved.id, tagIds);
        onSaved({ ...saved, tags: tags.map((tag) => ({ tag })) }, false);
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to save recipe.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="recipes-form-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-form-title"
    >
      <div className="recipes-form" onClick={(e) => e.stopPropagation()}>
        <div className="recipes-form__header">
          <h2 id="recipe-form-title">
            {recipe ? "Edit Recipe" : draft ? "Review imported recipe" : "New Recipe"}
          </h2>
          <button type="button" className="recipes-form__close" onClick={onClose} aria-label="Close">
            <span className="recipes-form__close-icon" aria-hidden>&times;</span>
          </button>
        </div>
        <form className="recipes-form__form" onSubmit={handleSubmit}>
          <div className="recipes-form__body">
          <div className="recipes-form__section recipes-form__section--basics">
          <label className="recipes-form__field">
            <span>Title *</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="recipes-form__field">
            <span>Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="A short summary (optional)" />
          </label>
          <div className="recipes-form__row">
            <label className="recipes-form__field">
              <span>Servings</span>
              <input type="number" min={0.5} step={0.5} value={servings} onChange={(e) => setServings(Number(e.target.value))} />
            </label>
            <label className="recipes-form__field">
              <span>Unit</span>
              <input type="text" value={servingUnit} onChange={(e) => setServingUnit(e.target.value)} />
            </label>
          </div>
          <label className="recipes-form__field">
            <span>Folder</span>
            <select value={folderId} onChange={(e) => setFolderId(e.target.value)}>
              <option value="">None</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          </div>

          <div className="recipes-form__section">
            <h3>Tags</h3>
            <div className="recipes-form__tags">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`recipes-form__tag ${selectedTagIds.includes(tag.id) ? "recipes-form__tag--active" : ""}`}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.label}
                </button>
              ))}
              {pendingTagLabels.map((label) => (
                <button
                  key={`pending-${label}`}
                  type="button"
                  className="recipes-form__tag recipes-form__tag--active"
                  onClick={() =>
                    setPendingTagLabels((prev) => prev.filter((item) => item.toLowerCase() !== label.toLowerCase()))
                  }
                >
                  {label}
                </button>
              ))}
              <button type="button" className="recipes-form__add" onClick={openTagModal}>
                + Tag
              </button>
            </div>
          </div>

          <div className="recipes-form__section">
            <h3>Ingredients</h3>
            {ingredients.map((ing, i) => (
              <div key={i} className="recipes-form__ingredient">
                <input type="text" placeholder="Name" value={ing.name} onChange={(e) => setIngredients((prev) => { const n = [...prev]; n[i] = { ...n[i], name: e.target.value }; return n; })} />
                <input type="number" placeholder="Qty" min={0} step={0.25} value={ing.quantity || ""} onChange={(e) => setIngredients((prev) => { const n = [...prev]; n[i] = { ...n[i], quantity: e.target.value ? Number(e.target.value) : 0 }; return n; })} />
                <input type="text" placeholder="Unit" value={ing.unit} onChange={(e) => setIngredients((prev) => { const n = [...prev]; n[i] = { ...n[i], unit: e.target.value }; return n; })} />
                <button type="button" className="recipes-form__row-remove" onClick={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Remove ingredient">
                  <span aria-hidden>&times;</span>
                </button>
              </div>
            ))}
            <button type="button" className="recipes-form__add" onClick={() => setIngredients((prev) => [...prev, { name: "", quantity: 0, unit: "", notes: "", isOptional: false }])}>
              + Ingredient
            </button>
          </div>

          <div className="recipes-form__section">
            <h3>Steps</h3>
            <p className="recipes-form__section-hint">Timer is optional. Leave blank for steps without a countdown.</p>
            {steps.map((step, i) => (
              <div key={i} className="recipes-form__step">
                <span className="recipes-form__step-num" aria-hidden>{i + 1}</span>
                <textarea
                  className="recipes-form__step-instruction"
                  placeholder="Instruction"
                  value={step.instruction}
                  onChange={(e) => setSteps((prev) => { const n = [...prev]; n[i] = { ...n[i], instruction: e.target.value }; return n; })}
                  rows={2}
                />
                <input
                  type="number"
                  className="recipes-form__step-timer-input"
                  placeholder="min"
                  min={0}
                  step={0.5}
                  value={step.timerMinutes ?? ""}
                  onChange={(e) =>
                    setSteps((prev) => {
                      const n = [...prev];
                      const raw = e.target.value;
                      if (raw === "") {
                        n[i] = { ...n[i], timerMinutes: null };
                      } else {
                        const parsed = Number(raw);
                        n[i] = {
                          ...n[i],
                          timerMinutes: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
                        };
                      }
                      return n;
                    })
                  }
                  aria-label={`Step ${i + 1} timer in minutes (optional)`}
                />
                <button type="button" className="recipes-form__row-remove" onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Remove step">
                  <span aria-hidden>&times;</span>
                </button>
              </div>
            ))}
            <button type="button" className="recipes-form__add" onClick={() => setSteps((prev) => [...prev, { instruction: "", timerMinutes: null }])}>
              + Step
            </button>
          </div>
          </div>

          <div className="recipes-form__actions">
            <button type="button" className="recipes-form__cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="recipes-form__save" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>

      {tagModalOpen && (
        <NamePromptModal
          id="tag-prompt"
          title="New tag"
          label="Tag name"
          placeholder="e.g. Vegetarian"
          submitLabel="Create tag"
          value={tagName}
          onChange={setTagName}
          onClose={closeTagModal}
          onSubmit={handleCreateTag}
          saving={tagSaving}
        />
      )}
    </div>
  );
}

interface NamePromptModalProps {
  id: string;
  title: string;
  label: string;
  placeholder?: string;
  submitLabel?: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

function NamePromptModal({
  id,
  title,
  label,
  placeholder,
  submitLabel = "Create",
  value,
  onChange,
  onClose,
  onSubmit,
  saving,
}: NamePromptModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = `${id}-title`;

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  return (
    <div
      className="recipes-form-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="recipes-form recipes-form--confirm recipes-form--prompt"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="recipes-form__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="recipes-form__close" onClick={onClose} aria-label="Close" disabled={saving}>
            <span className="recipes-form__close-icon" aria-hidden>&times;</span>
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="recipes-form__body recipes-form__body--prompt">
            <label className="recipes-form__field">
              <span>{label}</span>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required
                disabled={saving}
                autoComplete="off"
              />
            </label>
          </div>
          <div className="recipes-form__actions recipes-form__actions--footer">
            <button type="button" className="recipes-form__cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="recipes-form__save" disabled={saving || !value.trim()}>
              {saving ? "Creating…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
