import { useState, useEffect, useRef, useCallback } from "react";
import type { Recipe, Ingredient } from "../../api/client";
import { substitutesApi } from "../../api/client";
import { formatQuantity } from "../../utils/formatQuantity";
import { resolveSubstitutes } from "../../utils/resolveSubstitutes";
import { useWakeLock } from "../../hooks/useWakeLock";
import { useSettingsStore } from "../../store/settingsStore";
import { hasActiveDietaryPreferences } from "../../utils/dietaryPreferences";
import { DIETARY_FILTER_DISCLAIMER, type SubstituteOption } from "../../types/dietary";
import { RecipeExportMenu } from "./RecipeExportMenu";
import "./RecipeView.scss";

// ─── Helpers ────────────────────────────────────────────────────────────────

function scaledIngredient(ing: Ingredient, scale: number): { quantity: number; text: string } {
  const q = ing.quantity * scale;
  return { quantity: q, text: formatQuantity(q) };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTimerMinutes(minutes: number): string {
  if (minutes < 1 && minutes > 0) {
    const secs = Math.round(minutes * 60);
    return secs === 60 ? "1m" : `${secs}s`;
  }
  return Number.isInteger(minutes) ? `${minutes}m` : `${minutes}m`;
}

// ─── StepTimer ──────────────────────────────────────────────────────────────

interface StepTimerProps {
  minutes: number;
}

function StepTimer({ minutes }: StepTimerProps) {
  const totalSeconds = Math.round(minutes * 60);
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    if (remaining <= 0) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          stop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [remaining, stop]);

  const reset = useCallback(() => {
    stop();
    setRemaining(totalSeconds);
  }, [stop, totalSeconds]);

  useEffect(() => () => stop(), [stop]);

  const done = remaining === 0;
  const pct = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;

  return (
    <div
      className={`step-timer ${done ? "step-timer--done" : ""} ${running ? "step-timer--running" : ""}`}
    >
      <div className="step-timer__track">
        <div className="step-timer__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="step-timer__body">
        <span className="step-timer__display">
          {done ? "Done!" : formatTime(remaining)}
        </span>
        <div className="step-timer__controls">
          {!done &&
            (running ? (
              <button
                type="button"
                className="step-timer__btn"
                onClick={stop}
                aria-label="Pause timer"
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                className="step-timer__btn step-timer__btn--start"
                onClick={start}
                aria-label="Start timer"
              >
                {remaining < totalSeconds ? "Resume" : `Start ${formatTimerMinutes(minutes)}`}
              </button>
            ))}
          {(remaining < totalSeconds || done) && (
            <button
              type="button"
              className="step-timer__btn step-timer__btn--reset"
              onClick={reset}
              aria-label="Reset timer"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RecipeImage ─────────────────────────────────────────────────────────────

interface RecipeImageProps {
  src: string;
  alt: string;
}

function RecipeImage({ src, alt }: RecipeImageProps) {
  const [errored, setErrored] = useState(false);
  if (errored) return null;
  return (
    <div className="recipe-view__image-wrap">
      <img
        className="recipe-view__image"
        src={src}
        alt={alt}
        onError={() => setErrored(true)}
        loading="lazy"
      />
    </div>
  );
}

// ─── RecipeView ──────────────────────────────────────────────────────────────

export interface RecipeViewProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: () => void;
  onAddAllToList?: (servings: number) => void;
  onAddSelectedToList?: (items: {
    name: string;
    quantity: number;
    unit: string;
    notes: string | null;
  }[]) => void;
}

type RecipeWithOptionalImage = Recipe & { imageUrl?: string | null };

type SubstituteCacheEntry = {
  substitutes: SubstituteOption[];
  index: number;
  noSubstitute: boolean;
  preferencesRelaxed: boolean;
};

export function RecipeView({
  recipe,
  onClose,
  onEdit,
  onAddAllToList,
  onAddSelectedToList,
}: RecipeViewProps) {
  const r = recipe as RecipeWithOptionalImage;
  const wakeLock = useWakeLock();
  const dietaryPreferences = useSettingsStore((s) => s.dietaryPreferences);
  const prefsActive = hasActiveDietaryPreferences(dietaryPreferences);
  const [servings, setServings] = useState(recipe.servings);
  const [selectedIngIds, setSelectedIngIds] = useState<Set<string>>(new Set());
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const [subPanelOpen, setSubPanelOpen] = useState<Set<string>>(new Set());
  const [subCache, setSubCache] = useState<Map<string, SubstituteCacheEntry>>(new Map());
  const [subLoading, setSubLoading] = useState<Set<string>>(new Set());
  const subCacheRef = useRef(subCache);
  subCacheRef.current = subCache;
  const subFetchInFlightRef = useRef<Map<string, Promise<void>>>(new Map());
  /** Bumped when dietary prefs change so in-flight fetches can't write stale cache. */
  const dietaryEpochRef = useRef(0);
  const dietaryKey = JSON.stringify(dietaryPreferences);

  const loadSubstitutes = useCallback(async (ingKey: string, ingName: string) => {
    if (subCacheRef.current.has(ingKey)) return;

    const inflight = subFetchInFlightRef.current.get(ingKey);
    if (inflight) return inflight;

    const epochAtStart = dietaryEpochRef.current;
    let run!: Promise<void>;
    run = (async () => {
      setSubLoading((prev) => new Set(prev).add(ingKey));
      try {
        const prefs = useSettingsStore.getState().dietaryPreferences;
        const result = await resolveSubstitutes(
          ingName,
          (name, dietary) => substitutesApi.get(name, dietary),
          undefined,
          prefs
        );
        if (dietaryEpochRef.current !== epochAtStart) return;
        setSubCache((prev) =>
          new Map(prev).set(ingKey, {
            substitutes: result.substitutes,
            index: 0,
            noSubstitute: result.noSubstitute,
            preferencesRelaxed: result.preferencesRelaxed,
          })
        );
      } finally {
        // Always drop our own in-flight entry; never clear a newer request's promise.
        if (subFetchInFlightRef.current.get(ingKey) === run) {
          subFetchInFlightRef.current.delete(ingKey);
        }
        if (dietaryEpochRef.current === epochAtStart) {
          setSubLoading((prev) => {
            const next = new Set(prev);
            next.delete(ingKey);
            return next;
          });
        }
      }
    })();

    subFetchInFlightRef.current.set(ingKey, run);
    return run;
  }, []);

  // Clear + refetch open panels when dietary prefs change.
  useEffect(() => {
    dietaryEpochRef.current += 1;
    subCacheRef.current = new Map();
    setSubCache(new Map());
    subFetchInFlightRef.current.clear();
    setSubLoading(new Set());
    for (const ingKey of subPanelOpen) {
      const ing = recipe.ingredients.find((i, idx) => (i.id ?? String(idx)) === ingKey);
      if (ing) void loadSubstitutes(ingKey, ing.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dietaryKey]);

  const toggleSubPanel = useCallback(
    (ingKey: string, ingName: string) => {
      let opening = false;
      setSubPanelOpen((prev) => {
        const next = new Set(prev);
        if (next.has(ingKey)) {
          next.delete(ingKey);
        } else {
          next.add(ingKey);
          opening = true;
        }
        return next;
      });
      if (opening && !subCacheRef.current.has(ingKey)) {
        void loadSubstitutes(ingKey, ingName);
      }
    },
    [loadSubstitutes]
  );

  const cycleSubstitute = useCallback((ingKey: string) => {
    setSubCache((prev) => {
      const entry = prev.get(ingKey);
      if (!entry || entry.substitutes.length <= 1) return prev;
      const next = new Map(prev);
      next.set(ingKey, {
        ...entry,
        index: (entry.index + 1) % entry.substitutes.length,
      });
      return next;
    });
  }, []);

  const originalServings = recipe.servings;
  const scaleFactor = originalServings > 0 ? servings / originalServings : 1;
  const showServingUnit =
    recipe.servingUnit.trim() &&
    recipe.servingUnit.toLowerCase() !== "servings";

  const handleClose = useCallback(() => {
    void wakeLock.release().finally(onClose);
  }, [onClose, wakeLock]);

  const scaledIngredients = recipe.ingredients
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((ing) => ({ ...ing, ...scaledIngredient(ing, scaleFactor) }));

  const sortedSteps = recipe.steps
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const toggleIngredient = (id: string) => {
    setSelectedIngIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStep = (id: string) => {
    setCompletedStepIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllIngredients = () =>
    setSelectedIngIds(new Set(scaledIngredients.map((ing) => ing.id)));

  const deselectAllIngredients = () => setSelectedIngIds(new Set());

  const handleAddAllToList = () => onAddAllToList?.(servings);

  const handleAddSelectedToList = () => {
    const items = scaledIngredients
      .filter((ing) => selectedIngIds.has(ing.id) && !ing.isOptional)
      .map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit || "",
        notes: ing.notes ?? null,
      }));
    if (items.length > 0) onAddSelectedToList?.(items);
  };

  const selectedCount = selectedIngIds.size;
  const allIngredientsSelected =
    scaledIngredients.length > 0 && selectedCount === scaledIngredients.length;
  const canAddAll = onAddAllToList && scaledIngredients.length > 0;
  const hasShoppingList = Boolean(onAddAllToList || onAddSelectedToList);

  const completedCount = completedStepIds.size;
  const totalSteps = sortedSteps.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleEdit = () => {
    void wakeLock.release().finally(onEdit);
  };

  return (
    <div
      className="recipe-view-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-view-title"
    >
      <div className="recipe-view" onClick={(e) => e.stopPropagation()}>
        <header className="recipe-view__header">
          <h1 id="recipe-view-title" className="recipe-view__title">
            {recipe.title}
          </h1>
          <button
            type="button"
            className="recipe-view__close"
            onClick={handleClose}
            aria-label="Close"
          >
            <span className="recipe-view__close-icon" aria-hidden>×</span>
          </button>
        </header>

        {(recipe.folder || (recipe.tags && recipe.tags.length > 0)) && (
          <div className="recipe-view__chips">
            {recipe.folder && (
              <span className="recipe-view__chip recipe-view__chip--folder">
                {recipe.folder.name}
              </span>
            )}
            {recipe.tags?.map(({ tag }) => (
              <span key={tag.id} className="recipe-view__chip">
                {tag.label}
              </span>
            ))}
          </div>
        )}

        <div className="recipe-view__toolbar">
          <div className="recipe-view__servings">
            <span className="recipe-view__servings-label">Servings</span>
            <div className="recipe-view__servings-controls">
              <button
                type="button"
                className="recipe-view__servings-btn"
                onClick={() => setServings((s) => Math.max(0.5, s - 0.5))}
                aria-label="Decrease servings"
              >
                −
              </button>
              <input
                id="recipe-view-servings"
                type="number"
                min={0.5}
                step={0.5}
                value={servings}
                onChange={(e) =>
                  setServings(Math.max(0.5, Number(e.target.value) || 0.5))
                }
                className="recipe-view__servings-input"
                aria-label="Number of servings"
              />
              <button
                type="button"
                className="recipe-view__servings-btn"
                onClick={() => setServings((s) => s + 0.5)}
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
            {showServingUnit && (
              <span className="recipe-view__servings-unit">{recipe.servingUnit}</span>
            )}
          </div>

          <button
            type="button"
            className={`recipe-view__keep-awake ${wakeLock.enabled ? "recipe-view__keep-awake--on" : ""}`}
            onClick={() => void wakeLock.toggle()}
            disabled={!wakeLock.supported}
            aria-pressed={wakeLock.enabled}
            title={
              !wakeLock.supported
                ? "Screen wake lock is not supported in this browser"
                : wakeLock.enabled
                  ? "Tap to allow screen to sleep again"
                  : "Keep screen on while you cook"
            }
          >
            <span className="recipe-view__keep-awake-icon" aria-hidden>☀</span>
            {wakeLock.enabled ? "Screen on" : "Keep awake"}
          </button>
        </div>

        <div className="recipe-view__wrapper">
          <div className="recipe-view__content">
            {r.imageUrl && (
              <RecipeImage src={r.imageUrl} alt={recipe.title} />
            )}

            {recipe.description && (
              <p className="recipe-view__description">{recipe.description}</p>
            )}

            {(recipe.prepTime != null || recipe.cookTime != null) && (
              <div className="recipe-view__meta">
                {recipe.prepTime != null && (
                  <span className="recipe-view__meta-item">
                    <span className="recipe-view__meta-label">Prep</span>
                    {recipe.prepTime}m
                  </span>
                )}
                {recipe.cookTime != null && (
                  <span className="recipe-view__meta-item">
                    <span className="recipe-view__meta-label">Cook</span>
                    {recipe.cookTime}m
                  </span>
                )}
                {recipe.prepTime != null && recipe.cookTime != null && (
                  <span className="recipe-view__meta-item">
                    <span className="recipe-view__meta-label">Total</span>
                    {recipe.prepTime + recipe.cookTime}m
                  </span>
                )}
              </div>
            )}

            <section
              className="recipe-view__section"
              aria-labelledby="ingredients-heading"
            >
              <h2 id="ingredients-heading" className="recipe-view__section-title">
                Ingredients
              </h2>
              {(canAddAll || onAddSelectedToList) && (
                <div className="recipe-view__list-actions">
                  {canAddAll && (
                    <button
                      type="button"
                      className="recipe-view__list-btn"
                      onClick={handleAddAllToList}
                    >
                      Add all to shopping list
                    </button>
                  )}
                  {onAddSelectedToList && scaledIngredients.length > 0 && (
                    <>
                      <button
                        type="button"
                        className="recipe-view__list-btn recipe-view__list-btn--secondary"
                        onClick={allIngredientsSelected ? deselectAllIngredients : selectAllIngredients}
                      >
                        {allIngredientsSelected ? "Deselect all" : "Select all"}
                      </button>
                      {selectedCount > 0 && (
                        <button
                          type="button"
                          className="recipe-view__list-btn"
                          onClick={handleAddSelectedToList}
                        >
                          Add selected ({selectedCount}) to list
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              <ul
                className={`recipe-view__ingredients ${hasShoppingList ? "recipe-view__ingredients--selectable" : ""}`}
              >
                {scaledIngredients.map((ing, i) => {
                  const ingKey = ing.id ?? String(i);
                  const subOpen = subPanelOpen.has(ingKey);
                  const subEntry = subCache.get(ingKey);
                  const subIsLoading = subLoading.has(ingKey);
                  return (
                  <li key={ingKey} className="recipe-view__ingredient-item">
                    <div className="recipe-view__ingredient">
                    {onAddSelectedToList && (
                      <label className="recipe-view__ingredient-check">
                        <input
                          type="checkbox"
                          className="recipe-view__ingredient-check-input"
                          checked={selectedIngIds.has(ing.id)}
                          onChange={() => toggleIngredient(ing.id)}
                        />
                        <span className="recipe-view__ingredient-check-box" aria-hidden>
                          <span className="recipe-view__ingredient-check-icon">✓</span>
                        </span>
                        <span className="recipe-view__sr-only">
                          Select {ing.name} for shopping list
                        </span>
                      </label>
                    )}
                    <span className="recipe-view__ingredient-amount">
                      {ing.quantity > 0 ? (
                        <>
                          <span className="recipe-view__ingredient-qty">{ing.text}</span>
                          {ing.unit ? (
                            <span className="recipe-view__ingredient-unit">{ing.unit}</span>
                          ) : null}
                        </>
                      ) : null}
                    </span>
                    <span className="recipe-view__ingredient-name">
                      {ing.name}
                      {ing.notes ? ` (${ing.notes})` : ""}
                      {ing.isOptional ? " (optional)" : ""}
                    </span>
                    <button
                      type="button"
                      className={`recipe-view__sub-btn ${subOpen ? "recipe-view__sub-btn--open" : ""}`}
                      onClick={() => toggleSubPanel(ingKey, ing.name)}
                      aria-expanded={subOpen}
                      aria-controls={`sub-panel-${ingKey}`}
                      aria-label={`Substitute for ${ing.name}`}
                    >
                      Substitute
                    </button>
                  </div>
                  {subOpen && (
                    <div
                      id={`sub-panel-${ingKey}`}
                      className="recipe-view__sub-panel"
                      role="region"
                      aria-label={`Substitutes for ${ing.name}`}
                      aria-busy={subIsLoading}
                    >
                      {subIsLoading && (
                        <p className="recipe-view__sub-text recipe-view__sub-text--muted">
                          Finding substitutes...
                        </p>
                      )}
                      {!subIsLoading && subEntry?.noSubstitute && (
                        <p className="recipe-view__sub-text recipe-view__sub-text--muted">
                          No common substitute - this one&apos;s pretty essential here.
                        </p>
                      )}
                      {!subIsLoading && subEntry && !subEntry.noSubstitute && (
                        <>
                          {prefsActive && !subEntry.preferencesRelaxed && (
                            <p className="recipe-view__sub-text recipe-view__sub-text--muted">
                              Matched to your dietary preferences.
                            </p>
                          )}
                          {subEntry.preferencesRelaxed && (
                            <p className="recipe-view__sub-text recipe-view__sub-text--muted">
                              None matched your dietary preferences - showing all options.
                            </p>
                          )}
                          {subEntry.substitutes.length > 1 && (
                            <p className="recipe-view__sub-count" aria-live="polite">
                              {subEntry.index + 1} of {subEntry.substitutes.length}
                            </p>
                          )}
                          <p className="recipe-view__sub-text">
                            {subEntry.substitutes[subEntry.index]?.text}
                          </p>
                          {subEntry.substitutes[subEntry.index]?.sourcingNote && (
                            <p className="recipe-view__sub-sourcing">
                              {subEntry.substitutes[subEntry.index].sourcingNote}
                            </p>
                          )}
                          {subEntry.substitutes.length > 1 && (
                            <button
                              type="button"
                              className="recipe-view__sub-cycle"
                              onClick={() => cycleSubstitute(ingKey)}
                            >
                              Try another
                            </button>
                          )}
                          {prefsActive && (
                            <p className="recipe-view__sub-disclaimer">{DIETARY_FILTER_DISCLAIMER}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  </li>
                  );
                })}
              </ul>
            </section>

            <section
              className="recipe-view__section"
              aria-labelledby="steps-heading"
            >
              <div className="recipe-view__section-header">
                <h2 id="steps-heading" className="recipe-view__section-title">
                  Steps
                </h2>
                {totalSteps > 0 && (
                  <span className="recipe-view__step-progress">
                    {completedCount}/{totalSteps}
                  </span>
                )}
              </div>
              {totalSteps > 0 && (
                <div
                  className="recipe-view__progress-bar"
                  role="progressbar"
                  aria-valuenow={completedCount}
                  aria-valuemin={0}
                  aria-valuemax={totalSteps}
                >
                  <div
                    className="recipe-view__progress-fill"
                    style={{
                      width: `${(completedCount / totalSteps) * 100}%`,
                    }}
                  />
                </div>
              )}
              <ol className="recipe-view__steps">
                {sortedSteps.map((step, i) => {
                  const stepId = step.id ?? String(i);
                  const done = completedStepIds.has(stepId);
                  return (
                    <li
                      key={stepId}
                      className={`recipe-view__step ${done ? "recipe-view__step--done" : ""}`}
                    >
                      <button
                        type="button"
                        className="recipe-view__step-check"
                        onClick={() => toggleStep(stepId)}
                        aria-pressed={done}
                        aria-label={
                          done
                            ? `Mark step ${i + 1} incomplete`
                            : `Mark step ${i + 1} complete`
                        }
                      >
                        {done ? (
                          <span className="recipe-view__step-checkmark" aria-hidden>✓</span>
                        ) : (
                          <span className="recipe-view__step-num" aria-hidden>{i + 1}</span>
                        )}
                      </button>
                      <div className="recipe-view__step-body">
                        <span className="recipe-view__step-text">
                          {step.instruction}
                        </span>
                        {step.timerMinutes != null && step.timerMinutes > 0 && (
                          <StepTimer minutes={step.timerMinutes} />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {recipe.notes && (
              <section
                className="recipe-view__section recipe-view__notes-section"
                aria-labelledby="notes-heading"
              >
                <h2 id="notes-heading" className="recipe-view__section-title">
                  Notes
                </h2>
                <p className="recipe-view__notes">{recipe.notes}</p>
              </section>
            )}
          </div>
        </div>

        <footer className="recipe-view__footer">
          <RecipeExportMenu recipe={recipe} />
          <button type="button" className="recipe-view__edit" onClick={handleEdit}>
            Edit recipe
          </button>
        </footer>
      </div>
    </div>
  );
}
