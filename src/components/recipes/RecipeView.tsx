import { useState, useEffect, useRef, useCallback } from "react";
import type { Recipe, Ingredient } from "../../api/client";
import { formatQuantity } from "../../utils/formatQuantity";
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

// ─── StepTimer ──────────────────────────────────────────────────────────────

interface StepTimerProps {
  minutes: number;
}

function StepTimer({ minutes }: StepTimerProps) {
  const totalSeconds = minutes * 60;
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
                {remaining < totalSeconds ? "Resume" : `Start ${minutes}m`}
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

export function RecipeView({
  recipe,
  onClose,
  onEdit,
  onAddAllToList,
  onAddSelectedToList,
}: RecipeViewProps) {
  const r = recipe as RecipeWithOptionalImage;
  const [servings, setServings] = useState(recipe.servings);
  const [plainText, setPlainText] = useState(false);
  const [fitToScreen, setFitToScreen] = useState(false);
  const [selectedIngIds, setSelectedIngIds] = useState<Set<string>>(new Set());
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());

  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);

  const originalServings = recipe.servings;
  const scaleFactor = originalServings > 0 ? servings / originalServings : 1;

  useEffect(() => {
    if (!fitToScreen || !contentRef.current || !wrapperRef.current) {
      setScale(1);
      return;
    }
    const update = () => {
      const wrapper = wrapperRef.current;
      const content = contentRef.current;
      if (!wrapper || !content) return;
      const viewH = wrapper.clientHeight;
      const H = content.scrollHeight;
      setContentHeight(H);
      if (H <= 0) return;
      setScale(Math.max(0.35, Math.min(1, (viewH - 16) / H)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [fitToScreen, recipe.id, servings, plainText]);

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

  const handleAddAllToList = () => onAddAllToList?.(servings);

  const handleAddSelectedToList = () => {
    const items = scaledIngredients
      .filter((ing) => selectedIngIds.has(ing.id))
      .map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit || "",
        notes: ing.notes ?? null,
      }));
    if (items.length > 0) onAddSelectedToList?.(items);
  };

  const selectedCount = selectedIngIds.size;
  const canAddSelected = onAddSelectedToList && selectedCount > 0;
  const canAddAll = onAddAllToList && scaledIngredients.length > 0;

  const completedCount = completedStepIds.size;
  const totalSteps = sortedSteps.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="recipe-view-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-view-title"
    >
      <div
        className={`recipe-view ${plainText ? "recipe-view--plain" : ""} ${fitToScreen ? "recipe-view--fit" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="recipe-view__header">
          <h1 id="recipe-view-title" className="recipe-view__title">
            {recipe.title}
          </h1>
          <div className="recipe-view__header-actions">
            <button
              type="button"
              className="recipe-view__close"
              onClick={onClose}
              aria-label="Close"
            >
              <span aria-hidden>×</span>
            </button>
          </div>
        </header>

        <div className="recipe-view__toolbar">
          <div className="recipe-view__servings">
            <label htmlFor="recipe-view-servings">Servings</label>
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
            <span className="recipe-view__servings-unit">{recipe.servingUnit}</span>
          </div>

          <div className="recipe-view__modes" role="group" aria-label="View options">
            <button
              type="button"
              className={`recipe-view__mode-btn ${plainText ? "recipe-view__mode-btn--on" : ""}`}
              onClick={() => setPlainText((p) => !p)}
              aria-pressed={plainText}
            >
              Plain text
            </button>
            <button
              type="button"
              className={`recipe-view__mode-btn ${fitToScreen ? "recipe-view__mode-btn--on" : ""}`}
              onClick={() => setFitToScreen((f) => !f)}
              aria-pressed={fitToScreen}
              title="Fit entire recipe on one screen"
            >
              Fit to screen
            </button>
          </div>
        </div>

        <div className="recipe-view__wrapper" ref={wrapperRef}>
          <div
            className="recipe-view__scale-container"
            style={
              fitToScreen && contentHeight > 0
                ? { height: contentHeight * scale, flexShrink: 0 }
                : undefined
            }
          >
            <div
              className="recipe-view__content"
              ref={contentRef}
              style={
                fitToScreen
                  ? {
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                      width: scale > 0 ? `${100 / scale}%` : "100%",
                    }
                  : undefined
              }
            >
              {r.imageUrl && (
                <RecipeImage src={r.imageUrl} alt={recipe.title} />
              )}

              {recipe.description && !plainText && (
                <p className="recipe-view__description">{recipe.description}</p>
              )}

              {!plainText && (recipe.prepTime != null || recipe.cookTime != null) && (
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
                {(canAddAll || canAddSelected) && (
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
                          onClick={selectAllIngredients}
                        >
                          Select all
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
                <ul className="recipe-view__ingredients">
                  {scaledIngredients.map((ing, i) => (
                    <li key={ing.id ?? i} className="recipe-view__ingredient">
                      {onAddSelectedToList && (
                        <input
                          type="checkbox"
                          id={`ing-check-${ing.id ?? i}`}
                          className="recipe-view__ingredient-check"
                          checked={selectedIngIds.has(ing.id)}
                          onChange={() => toggleIngredient(ing.id)}
                          aria-label={`Add ${ing.name} to shopping list`}
                        />
                      )}
                      <span className="recipe-view__ingredient-qty">
                        {ing.quantity > 0 ? ing.text : ""}
                      </span>
                      {ing.quantity > 0 && ing.unit && (
                        <span className="recipe-view__ingredient-unit">
                          {ing.unit}
                        </span>
                      )}
                      <span className="recipe-view__ingredient-name">
                        {ing.name}
                        {ing.notes ? ` (${ing.notes})` : ""}
                        {ing.isOptional ? " (optional)" : ""}
                      </span>
                    </li>
                  ))}
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
                          <span className="recipe-view__step-num">{i + 1}</span>
                        </button>
                        <div className="recipe-view__step-body">
                          <span className="recipe-view__step-text">
                            {step.instruction}
                          </span>
                          {step.timerMinutes != null &&
                            step.timerMinutes > 0 &&
                            !plainText && (
                              <StepTimer minutes={step.timerMinutes} />
                            )}
                          {step.timerMinutes != null &&
                            step.timerMinutes > 0 &&
                            plainText && (
                              <span className="recipe-view__step-timer">
                                — {step.timerMinutes} min
                              </span>
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
        </div>

        <footer className="recipe-view__footer">
          <button type="button" className="recipe-view__edit" onClick={onEdit}>
            Edit recipe
          </button>
        </footer>
      </div>
    </div>
  );
}
