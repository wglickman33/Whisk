import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { useAuthModalStore } from "../store/authModalStore";
import {
  recipesApi,
  foldersApi,
  tagsApi,
  type Recipe,
  type RecipeInput,
  type FolderSummary,
  type Tag,
} from "../api/client";
import { useShoppingListStore } from "../store/shoppingListStore";
import { toastSuccess, toastError } from "../store/toastStore";
import { filterRecipes } from "../utils/filterRecipes";
import { IconRecipe } from "../components/ui/SidebarIcons";
import { RecipeView } from "../components/recipes/RecipeView";
import "./RecipesPage.scss";

export function RecipesPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState<string>("");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  const visibleRecipes = useMemo(
    () => filterRecipes(recipes, search, folderFilter || null),
    [recipes, search, folderFilter]
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

  const handleNewFolder = async () => {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    try {
      const folder = await foldersApi.create(name.trim());
      setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
      toastSuccess("Folder created.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not create folder.");
    }
  };

  if (!isSignedIn) {
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
        <button type="button" className="recipes-page__folder-btn" onClick={handleNewFolder}>
          + Folder
        </button>
      </div>

      <form className="recipes-page__import" onSubmit={handleImport}>
        <input
          type="url"
          placeholder="Paste recipe URL to import…"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          aria-label="Recipe URL"
        />
        <button type="submit" disabled={importing || !importUrl.trim()}>
          {importing ? "Importing…" : "Import"}
        </button>
      </form>

      <div className="recipes-page__body">
        {loading && <p className="recipes-page__loading">Loading recipes…</p>}

        {!loading && visibleRecipes.length === 0 && !formOpen && (
          <p className="recipes-page__empty">
            {recipes.length === 0
              ? 'No recipes yet. Click "New Recipe" or import from a URL.'
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
                  <button
                    type="button"
                    className="recipes-page__card-btn"
                    onClick={() => {
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
          folders={folders}
          allTags={allTags}
          onClose={() => {
            setFormOpen(false);
            setEditingId(null);
          }}
          onTagsChanged={setAllTags}
          onSaved={(recipe, isUpdate) => {
            setFormOpen(false);
            setEditingId(null);
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
              setEditingId(recipe.id);
              setFormOpen(true);
            }}
            onAddAllToList={(currentServings) => {
              useShoppingListStore.getState().addRecipe(
                {
                  id: recipe.id,
                  title: recipe.title,
                  servings: recipe.servings,
                  ingredients: recipe.ingredients,
                },
                currentServings
              );
              toastSuccess("Added to shopping list.");
            }}
            onAddSelectedToList={(items) => {
              useShoppingListStore.getState().addItems(
                items.map((item) => ({
                  ...item,
                  sourceRecipeId: recipe.id,
                  sourceRecipeTitle: recipe.title,
                }))
              );
              toastSuccess("Added to shopping list.");
            }}
          />
        );
      })()}

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
  folders: FolderSummary[];
  allTags: Tag[];
  onClose: () => void;
  onSaved: (recipe: Recipe, isUpdate?: boolean) => void;
  onTagsChanged: (tags: Tag[]) => void;
}

function RecipeForm({ recipe, folders, allTags, onClose, onSaved, onTagsChanged }: RecipeFormProps) {
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [servings, setServings] = useState(recipe?.servings ?? 4);
  const [servingUnit, setServingUnit] = useState(recipe?.servingUnit ?? "Servings");
  const [folderId, setFolderId] = useState(recipe?.folderId ?? recipe?.folder?.id ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    recipe?.tags?.map((t) => t.tag.id) ?? []
  );
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients.length
      ? recipe.ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          notes: i.notes ?? "",
          isOptional: i.isOptional,
        }))
      : [{ name: "", quantity: 0, unit: "", notes: "", isOptional: false }]
  );
  const [steps, setSteps] = useState(
    recipe?.steps.length
      ? recipe.steps.map((s) => ({ instruction: s.instruction, timerMinutes: s.timerMinutes }))
      : [{ instruction: "", timerMinutes: null as number | null }]
  );
  const [saving, setSaving] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleNewTag = async () => {
    const label = window.prompt("Tag name");
    if (!label?.trim()) return;
    try {
      const tag = await tagsApi.create(label.trim());
      onTagsChanged([...allTags, tag].sort((a, b) => a.label.localeCompare(b.label)));
      setSelectedTagIds((prev) => [...prev, tag.id]);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not create tag.");
    }
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
          .map((s) => ({
            instruction: s.instruction.trim(),
            timerMinutes: s.timerMinutes != null ? Number(s.timerMinutes) : null,
          })),
      };

      let saved: Recipe;
      if (recipe) {
        saved = await recipesApi.update(recipe.id, body);
        const { tags } = await tagsApi.setRecipeTags(recipe.id, selectedTagIds);
        onSaved({ ...saved, tags: tags.map((tag) => ({ tag })) }, true);
      } else {
        saved = await recipesApi.create(body);
        const { tags } = await tagsApi.setRecipeTags(saved.id, selectedTagIds);
        onSaved({ ...saved, tags: tags.map((tag) => ({ tag })) }, false);
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to save recipe.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="recipes-form-overlay" onClick={onClose}>
      <div className="recipes-form" onClick={(e) => e.stopPropagation()}>
        <div className="recipes-form__header">
          <h2>{recipe ? "Edit Recipe" : "New Recipe"}</h2>
          <button type="button" className="recipes-form__close" onClick={onClose} aria-label="Close">
            <span className="recipes-form__close-icon" aria-hidden>&times;</span>
          </button>
        </div>
        <form className="recipes-form__body" onSubmit={handleSubmit}>
          <label className="recipes-form__field">
            <span>Title *</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="recipes-form__field">
            <span>Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ resize: "none" }} />
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
              <button type="button" className="recipes-form__add" onClick={handleNewTag}>
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
                <button type="button" onClick={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Remove ingredient">&times;</button>
              </div>
            ))}
            <button type="button" className="recipes-form__add" onClick={() => setIngredients((prev) => [...prev, { name: "", quantity: 0, unit: "", notes: "", isOptional: false }])}>
              + Ingredient
            </button>
          </div>

          <div className="recipes-form__section">
            <h3>Steps</h3>
            {steps.map((step, i) => (
              <div key={i} className="recipes-form__step">
                <span className="recipes-form__step-num">{i + 1}.</span>
                <textarea placeholder="Instruction" value={step.instruction} onChange={(e) => setSteps((prev) => { const n = [...prev]; n[i] = { ...n[i], instruction: e.target.value }; return n; })} rows={2} style={{ resize: "none" }} />
                <button type="button" onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Remove step">&times;</button>
              </div>
            ))}
            <button type="button" className="recipes-form__add" onClick={() => setSteps((prev) => [...prev, { instruction: "", timerMinutes: null }])}>
              + Step
            </button>
          </div>

          <div className="recipes-form__actions">
            <button type="button" className="recipes-form__cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="recipes-form__save" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
