import { useState, useEffect, useRef, useCallback, useMemo, type FormEvent } from "react";
import {
  type UnitCategory,
  convert,
  getUnitsForCategory,
  getDefaultFromUnit,
  getDefaultToUnit,
  CATEGORY_LABELS,
  UNIT_CATEGORIES,
} from "../../../converters/units/unitUtils";
import {
  parseUnitInput,
  formatUnitOutput,
  formatCopyText,
  getUnitInputFeedback,
} from "../../../converters/units/unitInput";
import { QUICK_PICKS, type QuickPick } from "../../../converters/units/unitPresets";
import { getUnitConverterKeyAction } from "../../../converters/units/unitKeyboard";
import {
  isKitchenCategory,
  getSystemDefaults,
  type UnitSystem,
} from "../../../converters/units/unitReference";
import {
  addRecentConversion,
  addFavoritePair,
  getFavoritePairs,
  getRecentConversions,
  isFavoritePair,
  removeFavoritePair,
  type FavoritePair,
  type SavedConversion,
} from "../../../converters/units/unitStorage";
import { getCategoryHint } from "../../../converters/units/unitMulti";
import { useSettingsStore } from "../../../store/settingsStore";
import { toastSuccess, toastError } from "../../../store/toastStore";
import { CategoryIcon } from "./categoryIcons";
import { UnitConverterReferenceTable } from "./UnitConverterReferenceTable";
import { UnitConverterSidebar } from "./UnitConverterSidebar";
import "./UnitConverter.scss";

const PRIMARY_CATEGORIES: UnitCategory[] = ["volume", "weight", "temp"];
const MORE_CATEGORIES = UNIT_CATEGORIES.filter((c) => !PRIMARY_CATEGORIES.includes(c));
const VISIBLE_EXAMPLES = 3;

const AMOUNT_FORMATS = ["2", "1.5", "1/2", "1 1/2"];

type CommittedConversion = {
  category: UnitCategory;
  fromUnit: string;
  toUnit: string;
  input: string;
  parsedInput: number;
  output: number;
};

export function UnitConverter() {
  const defaultCategory = useSettingsStore((s) => s.defaultUnitCategory);
  const [category, setCategory] = useState<UnitCategory>(defaultCategory);
  const [fromUnit, setFromUnit] = useState(getDefaultFromUnit(defaultCategory));
  const [toUnit, setToUnit] = useState(getDefaultToUnit(defaultCategory));
  const [input, setInput] = useState("");
  const [committed, setCommitted] = useState<CommittedConversion | null>(null);
  const [swapRotation, setSwapRotation] = useState(0);
  const [copied, setCopied] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("us");
  const [showMoreCategories, setShowMoreCategories] = useState(
    () => !PRIMARY_CATEGORIES.includes(defaultCategory)
  );
  const [recent, setRecent] = useState<SavedConversion[]>(() => getRecentConversions());
  const [favorites, setFavorites] = useState<FavoritePair[]>(() => getFavoritePairs());
  const inputRef = useRef<HTMLInputElement>(null);

  const units = getUnitsForCategory(category);
  const quickPicks = QUICK_PICKS[category].slice(0, VISIBLE_EXAMPLES);
  const showKitchenTools = isKitchenCategory(category);
  const parsedInput = useMemo(() => parseUnitInput(input), [input]);
  const inputFeedback = useMemo(() => getUnitInputFeedback(input), [input]);
  const categoryHint = getCategoryHint(category);
  const currentFavorite = isFavoritePair(category, fromUnit, toUnit);

  const draftMatchesCommitted =
    committed !== null &&
    committed.input === input &&
    committed.fromUnit === fromUnit &&
    committed.toUnit === toUnit &&
    committed.category === category;

  const performConversion = useCallback(
    (overrides?: {
      category?: UnitCategory;
      fromUnit?: string;
      toUnit?: string;
      input?: string;
      saveRecent?: boolean;
    }) => {
      const cat = overrides?.category ?? category;
      const from = overrides?.fromUnit ?? fromUnit;
      const to = overrides?.toUnit ?? toUnit;
      const amountStr = overrides?.input ?? input;
      const val = parseUnitInput(amountStr);
      if (val === null) return false;

      if (overrides?.category !== undefined) setCategory(overrides.category);
      if (overrides?.fromUnit !== undefined) setFromUnit(overrides.fromUnit);
      if (overrides?.toUnit !== undefined) setToUnit(overrides.toUnit);
      if (overrides?.input !== undefined) setInput(overrides.input);

      const converted = convert(val, cat, from, to);
      setCommitted({
        category: cat,
        fromUnit: from,
        toUnit: to,
        input: amountStr,
        parsedInput: val,
        output: converted,
      });

      if (overrides?.saveRecent !== false) {
        setRecent(
          addRecentConversion({
            category: cat,
            fromUnit: from,
            toUnit: to,
            input: amountStr,
          })
        );
      }

      return true;
    },
    [category, fromUnit, toUnit, input]
  );

  useEffect(() => {
    setCategory(defaultCategory);
    setFromUnit(getDefaultFromUnit(defaultCategory));
    setToUnit(getDefaultToUnit(defaultCategory));
    setShowMoreCategories(!PRIMARY_CATEGORIES.includes(defaultCategory));
  }, [defaultCategory]);

  const handleCategoryChange = (c: UnitCategory) => {
    setCategory(c);
    if (isKitchenCategory(c)) {
      const defaults = getSystemDefaults(c, unitSystem);
      setFromUnit(defaults.from);
      setToUnit(defaults.to);
    } else {
      setFromUnit(getDefaultFromUnit(c));
      setToUnit(getDefaultToUnit(c));
    }
    setInput("");
    setCommitted(null);
  };

  const handleSystemChange = (system: UnitSystem) => {
    setUnitSystem(system);
    if (!isKitchenCategory(category)) return;
    const defaults = getSystemDefaults(category, system);
    setFromUnit(defaults.from);
    setToUnit(defaults.to);
  };

  const swapUnits = useCallback(() => {
    const nextFrom = toUnit;
    const nextTo = fromUnit;
    setFromUnit(nextFrom);
    setToUnit(nextTo);
    if (draftMatchesCommitted && committed) {
      setInput(String(committed.output));
    }
    setCommitted(null);
    setSwapRotation((r) => r + 180);
  }, [fromUnit, toUnit, draftMatchesCommitted, committed]);

  const handleConvert = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      performConversion();
    },
    [performConversion]
  );

  const applyConversion = useCallback(
    (entry: { category: UnitCategory; fromUnit: string; toUnit: string; input?: string }) => {
      performConversion({
        category: entry.category,
        fromUnit: entry.fromUnit,
        toUnit: entry.toUnit,
        input: entry.input ?? "1",
      });
      inputRef.current?.focus();
    },
    [performConversion]
  );

  const applyReference = useCallback(
    (from: string, to: string, amount: string) => {
      performConversion({ fromUnit: from, toUnit: to, input: amount });
      inputRef.current?.focus();
    },
    [performConversion]
  );

  const applyQuickPick = (pick: QuickPick) => {
    performConversion({
      fromUnit: pick.from,
      toUnit: pick.to,
      input: pick.value ?? "1",
    });
    inputRef.current?.focus();
  };

  const handleToggleFavorite = () => {
    if (currentFavorite) {
      const match = favorites.find(
        (f) => f.category === category && f.fromUnit === fromUnit && f.toUnit === toUnit
      );
      if (match) setFavorites(removeFavoritePair(match.id));
      return;
    }
    setFavorites(addFavoritePair({ category, fromUnit, toUnit }));
    toastSuccess("Saved to favorites.");
  };

  const handleCopy = useCallback(() => {
    if (!draftMatchesCommitted || !committed) return;
    navigator.clipboard
      .writeText(formatCopyText(committed.output, committed.toUnit))
      .then(() => {
        setCopied(true);
        toastSuccess("Copied to clipboard.");
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => toastError("Copy failed."));
  }, [draftMatchesCommitted, committed]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.target === inputRef.current) {
        e.preventDefault();
        performConversion();
        return;
      }
      const action = getUnitConverterKeyAction(e.key, e.target);
      if (action === "none") return;
      e.preventDefault();
      if (action === "focus-input") inputRef.current?.focus();
      if (action === "swap-units") swapUnits();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [swapUnits, performConversion]);

  const canConvert = parsedInput !== null;
  const outputDisplay =
    draftMatchesCommitted && committed
      ? formatUnitOutput(committed.output)
      : null;
  const hasResult = outputDisplay != null;
  const showStaleHint = committed !== null && !draftMatchesCommitted && input.trim().length > 0;
  const multiTableInput = draftMatchesCommitted && committed ? committed.parsedInput : null;

  const renderCategoryButton = (c: UnitCategory) => (
    <button
      key={c}
      type="button"
      role="tab"
      aria-selected={category === c}
      className={`uc__cat ${category === c ? "uc__cat--active" : ""}`}
      onClick={() => handleCategoryChange(c)}
    >
      <CategoryIcon category={c} className="uc__cat-icon" />
      <span>{CATEGORY_LABELS[c]}</span>
    </button>
  );

  return (
    <div className={`uc uc--${category}`}>
      <header className="uc__header">
        <h1 className="uc__title">Unit Converter</h1>
        <p className="uc__tagline">
          Enter your amount and units, then click Convert.
        </p>
      </header>

      <div className="uc__panel">
        <section className="uc__step">
          <div className="uc__step-head">
            <span className="uc__step-num" aria-hidden>1</span>
            <div>
              <h2 className="uc__step-title">What are you converting?</h2>
              <p className="uc__step-desc">Pick the type that best matches your measurement.</p>
            </div>
          </div>

          <div className="uc__categories uc__categories--primary" role="tablist" aria-label="Common categories">
            {PRIMARY_CATEGORIES.map(renderCategoryButton)}
          </div>

          {!showMoreCategories ? (
            <button
              type="button"
              className="uc__expand-cats"
              onClick={() => setShowMoreCategories(true)}
            >
              More types: length, time, data, and others
            </button>
          ) : (
            <div className="uc__categories uc__categories--more" role="tablist" aria-label="More categories">
              {MORE_CATEGORIES.map(renderCategoryButton)}
            </div>
          )}
        </section>

        <div className="uc__layout">
          <div className="uc__main">
            <section className="uc__step uc__step--convert">
              <div className="uc__step-head">
                <span className="uc__step-num" aria-hidden>2</span>
                <div>
                  <h2 className="uc__step-title">Enter your amount and units</h2>
                  <p className="uc__step-desc">
                    Whole numbers, decimals, and fractions are all supported. Press Convert when ready.
                  </p>
                </div>
              </div>

              {showKitchenTools && (
                <div className="uc__system" role="group" aria-label="Measuring system">
                  <span className="uc__system-label">I measure in</span>
                  <div className="uc__system-toggle">
                    <button
                      type="button"
                      className={`uc__system-btn ${unitSystem === "us" ? "uc__system-btn--active" : ""}`}
                      onClick={() => handleSystemChange("us")}
                    >
                      US (cups, oz)
                    </button>
                    <button
                      type="button"
                      className={`uc__system-btn ${unitSystem === "metric" ? "uc__system-btn--active" : ""}`}
                      onClick={() => handleSystemChange("metric")}
                    >
                      Metric (ml, g)
                    </button>
                  </div>
                </div>
              )}

              <form className="uc__converter-card" onSubmit={handleConvert}>
                <div className="uc__field">
                  <label className="uc__field-label" htmlFor="uc-input">
                    Amount
                  </label>
                  <input
                    ref={inputRef}
                    id="uc-input"
                    type="text"
                    inputMode="decimal"
                    className={`uc__input uc__input--hero ${inputFeedback === "invalid" ? "uc__input--invalid" : ""}`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. 2, 1.5, or 1/2"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={inputFeedback === "invalid"}
                    aria-describedby="uc-amount-help"
                  />
                  <div id="uc-amount-help" className="uc__amount-formats">
                    {AMOUNT_FORMATS.map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        className="uc__format-chip"
                        onClick={() => {
                          setInput(fmt);
                          inputRef.current?.focus();
                        }}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                  {inputFeedback === "invalid" && (
                    <p className="uc__input-error">
                      Use a whole number (2), decimal (1.5), or fraction (1/2 or 1 1/2).
                    </p>
                  )}
                </div>

                <div className="uc__units-row">
                  <div className="uc__field uc__field--unit">
                    <label className="uc__field-label" htmlFor="uc-from-unit">
                      From
                    </label>
                    <select
                      id="uc-from-unit"
                      className="uc__select uc__select--full"
                      value={fromUnit}
                      onChange={(e) => setFromUnit(e.target.value)}
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="uc__swap-icon"
                    onClick={swapUnits}
                    aria-label="Swap units"
                    title="Swap units"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ transform: `rotate(${swapRotation}deg)` }}
                    >
                      <path d="M7 16V4M7 4L3 8M7 4l4 4" />
                      <path d="M17 8v12M17 20l4-4M17 20l-4-4" />
                    </svg>
                  </button>

                  <div className="uc__field uc__field--unit">
                    <label className="uc__field-label" htmlFor="uc-to-unit">
                      To
                    </label>
                    <select
                      id="uc-to-unit"
                      className="uc__select uc__select--full"
                      value={toUnit}
                      onChange={(e) => setToUnit(e.target.value)}
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="uc__convert-btn"
                  disabled={!canConvert}
                >
                  Convert
                </button>

                <div
                  className={`uc__result-block ${hasResult ? "uc__result-block--filled" : ""} ${showStaleHint ? "uc__result-block--stale" : ""}`}
                >
                  <div className="uc__result-head">
                    <span className="uc__result-label">Your result</span>
                    {hasResult && committed && (
                      <span className="uc__result-summary">
                        {committed.input} {committed.fromUnit} → {committed.toUnit}
                      </span>
                    )}
                  </div>

                  <output className="uc__output" aria-live="polite">
                    {hasResult && committed ? (
                      <div key={outputDisplay} className="uc__result-hero">
                        <span className="uc__result-number">{outputDisplay}</span>
                        <span className="uc__result-unit-pill">{committed.toUnit}</span>
                      </div>
                    ) : (
                      <div className="uc__result-empty">
                        <span className="uc__placeholder">
                          {showStaleHint
                            ? "Values changed. Click Convert to update."
                            : "Click Convert to see your result"}
                        </span>
                        {!input.trim() && !showStaleHint && (
                          <p className="uc__empty-hint">{categoryHint}</p>
                        )}
                      </div>
                    )}
                  </output>
                </div>

                <button
                  type="button"
                  className={`uc__copy-btn ${copied ? "uc__copy-btn--done" : ""}`}
                  onClick={handleCopy}
                  disabled={!hasResult}
                >
                  {copied ? "Copied!" : "Copy result"}
                </button>
              </form>

              <div className="uc__examples">
                <span className="uc__examples-label">Try an example</span>
                <div className="uc__quick-picks" role="group" aria-label="Example conversions">
                  {quickPicks.map((pick) => (
                    <button
                      key={pick.label}
                      type="button"
                      className="uc__chip"
                      onClick={() => applyQuickPick(pick)}
                    >
                      {pick.label}
                    </button>
                  ))}
                </div>
              </div>

              {category === "data" && (
                <p className="uc__data-note">
                  File sizes on your computer use these units (1 MB = 1024 KB).
                </p>
              )}
            </section>
          </div>

          <aside className="uc__sidebar">
            <UnitConverterReferenceTable category={category} onApply={applyReference} />
            <UnitConverterSidebar
              category={category}
              toUnit={toUnit}
              fromUnit={fromUnit}
              parsedInput={multiTableInput}
              showKitchenTools={showKitchenTools}
              recent={recent}
              favorites={favorites}
              isCurrentFavorite={currentFavorite}
              onToggleFavorite={handleToggleFavorite}
              onApplyRecent={applyConversion}
              onApplyFavorite={applyConversion}
              onRemoveFavorite={(id) => setFavorites(removeFavoritePair(id))}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
