import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import { useAuthModalStore } from "../store/authModalStore";
import { recipesApi, type Recipe, type RecipeInput } from "../api/client";
import { useShoppingListStore } from "../store/shoppingListStore";
import { toastSuccess, toastError } from "../store/toastStore";
import { IconRecipe } from "../components/ui/SidebarIcons";
import { RecipeView } from "../components/recipes/RecipeView";
import "./RecipesPage.scss";

export function RecipesPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const { recipes: list } = await recipesApi.list();
      setRecipes(list);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

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
              <p className="recipes-page__guest-text">
                Sign in to save and manage your recipes.
              </p>
              <p className="recipes-page__guest-sub">
                Your recipes stay private and sync across devices.
              </p>
              <button type="button" className="recipes-page__cta" onClick={openAuthModal}>
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
        <button type="button" className="recipes-page__new" onClick={() => { setEditingId(null); setFormOpen(true); }}>
          New Recipe
        </button>
      </header>

      <div className="recipes-page__body">
      {loading && <p className="recipes-page__loading">Loading recipes...</p>}

      {!loading && recipes.length === 0 && !formOpen && (
        <p className="recipes-page__empty">No recipes yet. Click &quot;New Recipe&quot; to add one.</p>
      )}

      {!loading && recipes.length > 0 && (
        <ul className="recipes-page__list">
          {recipes.map((r) => (
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
                {r.description && (
                  <p className="recipes-page__card-desc">{r.description}</p>
                )}
                <span className="recipes-page__card-meta">
                  {r.servings} {r.servingUnit}
                </span>
              </div>
              <div className="recipes-page__card-actions">
                <button
                  type="button"
                  className="recipes-page__card-btn recipes-page__card-btn--view"
                  onClick={() => setViewingId(r.id)}
                >
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
                <button
                  type="button"
                  className="recipes-page__card-btn recipes-page__card-btn--danger"
                  onClick={() => setDeleteConfirm(r.id)}
                >
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
          recipe={editingId ? (recipes.find((r) => r.id === editingId) ?? null) : null}
          onClose={() => { setFormOpen(false); setEditingId(null); }}
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
                items.map((item) => ({ ...item, sourceRecipeId: recipe.id, sourceRecipeTitle: recipe.title }))
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
          <div
            className="recipes-form-overlay"
            onClick={() => setDeleteConfirm(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-recipe-title"
          >
            <div
              className="recipes-form recipes-form--confirm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="recipes-form__header">
                <h2 id="delete-recipe-title">Delete recipe?</h2>
                <button
                  type="button"
                  className="recipes-form__close"
                  onClick={() => setDeleteConfirm(null)}
                  aria-label="Close"
                >
                  <span className="recipes-form__close-icon" aria-hidden>×</span>
                </button>
              </div>
              <div className="recipes-form__body">
                <p className="recipes-form__confirm-msg">
                  Are you sure you want to delete <strong>{recipe.title}</strong>? This cannot be undone.
                </p>
              </div>
              <div className="recipes-form__actions recipes-form__actions--footer">
                <button
                  type="button"
                  className="recipes-form__cancel"
                  onClick={() => setDeleteConfirm(null)}
                >
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
  onClose: () => void;
  onSaved: (recipe: Recipe, isUpdate?: boolean) => void;
}

function RecipeForm({ recipe, onClose, onSaved }: RecipeFormProps) {
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [servings, setServings] = useState(recipe?.servings ?? 4);
  const [servingUnit, setServingUnit] = useState(recipe?.servingUnit ?? "Servings");
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients.length
      ? recipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit, notes: i.notes ?? "", isOptional: i.isOptional }))
      : [{ name: "", quantity: 0, unit: "", notes: "", isOptional: false }]
  );
  const [steps, setSteps] = useState(
    recipe?.steps.length
      ? recipe.steps.map((s) => ({ instruction: s.instruction, timerMinutes: s.timerMinutes }))
      : [{ instruction: "", timerMinutes: null as number | null }]
  );
  const [saving, setSaving] = useState(false);

  const addIngredient = () => setIngredients((prev) => [...prev, { name: "", quantity: 0, unit: "", notes: "", isOptional: false }]);
  const removeIngredient = (i: number) => setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, field: string, value: string | number | boolean) => {
    setIngredients((prev) => {
      const next = [...prev];
      (next[i] as Record<string, unknown>)[field] = value;
      return next;
    });
  };

  const addStep = () => setSteps((prev) => [...prev, { instruction: "", timerMinutes: null }]);
  const removeStep = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: string, value: string | number | null) => {
    setSteps((prev) => {
      const next = [...prev];
      (next[i] as Record<string, unknown>)[field] = value;
      return next;
    });
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
      if (recipe) {
        const updated = await recipesApi.update(recipe.id, body);
        onSaved(updated, true);
      } else {
        const created = await recipesApi.create(body);
        onSaved(created, false);
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
              <input type="text" value={servingUnit} onChange={(e) => setServingUnit(e.target.value)} placeholder="Servings" />
            </label>
          </div>

          <div className="recipes-form__section">
            <h3>Ingredients</h3>
            {ingredients.map((ing, i) => (
              <div key={i} className="recipes-form__ingredient">
                <input type="text" placeholder="Name" value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)} />
                <input type="number" placeholder="Qty" min={0} step={0.25} value={ing.quantity || ""} onChange={(e) => updateIngredient(i, "quantity", e.target.value ? Number(e.target.value) : 0)} />
                <input type="text" placeholder="Unit" value={ing.unit} onChange={(e) => updateIngredient(i, "unit", e.target.value)} />
                <label><input type="checkbox" checked={ing.isOptional} onChange={(e) => updateIngredient(i, "isOptional", e.target.checked)} /> Optional</label>
                <button type="button" onClick={() => removeIngredient(i)} aria-label="Remove ingredient">&times;</button>
              </div>
            ))}
            <button type="button" className="recipes-form__add" onClick={addIngredient}>+ Ingredient</button>
          </div>

          <div className="recipes-form__section">
            <h3>Steps</h3>
            {steps.map((step, i) => (
              <div key={i} className="recipes-form__step">
                <span className="recipes-form__step-num">{i + 1}.</span>
                <textarea placeholder="Instruction" value={step.instruction} onChange={(e) => updateStep(i, "instruction", e.target.value)} rows={2} style={{ resize: "none" }} />
                <input type="number" placeholder="Timer (min)" min={0} step={1} value={step.timerMinutes ?? ""} onChange={(e) => updateStep(i, "timerMinutes", e.target.value ? Number(e.target.value) : null)} />
                <button type="button" onClick={() => removeStep(i)} aria-label="Remove step">&times;</button>
              </div>
            ))}
            <button type="button" className="recipes-form__add" onClick={addStep}>+ Step</button>
          </div>

          <div className="recipes-form__actions">
            <button type="button" className="recipes-form__cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="recipes-form__save" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
