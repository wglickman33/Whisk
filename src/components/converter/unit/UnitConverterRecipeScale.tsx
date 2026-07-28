import { useMemo, useState } from "react";
import { parseScaleMultiplier, scaleRecipeText } from "../../../converters/units/recipeScale";

const PLACEHOLDER = `2 cups flour
1/2 tsp salt
3 large eggs
1 tbsp olive oil`;

type Props = {
  embedded?: boolean;
};

export function UnitConverterRecipeScale({ embedded = false }: Props) {
  const [multiplier, setMultiplier] = useState("2");
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(embedded);

  const scale = parseScaleMultiplier(multiplier);

  const scaledLines = useMemo(() => {
    if (!input.trim() || scale === null) return [];
    return scaleRecipeText(input, scale);
  }, [input, scale]);

  const content = (
    <div className="uc__scale">
      <p className="uc__help-text">
        Paste your ingredient list below. Choose how much to scale it (2 = double, 0.5 = half).
      </p>
      <div className="uc__scale-controls">
        <label className="uc__field-label" htmlFor="uc-scale-mult">
          Scale by
        </label>
        <input
          id="uc-scale-mult"
          type="text"
          className="uc__scale-mult"
          value={multiplier}
          onChange={(e) => setMultiplier(e.target.value)}
          placeholder="2"
          inputMode="decimal"
        />
        <span className="uc__scale-hint">× original amounts</span>
      </div>
      <div className="uc__scale-grid">
        <div className="uc__scale-col">
          <label className="uc__field-label" htmlFor="uc-scale-input">
            Your ingredients
          </label>
          <textarea
            id="uc-scale-input"
            className="uc__scale-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={6}
            spellCheck={false}
          />
        </div>
        <div className="uc__scale-col">
          <span className="uc__field-label">Scaled list</span>
          <div className="uc__scale-output" aria-live="polite">
            {scaledLines.length > 0 ? (
              <ul>
                {scaledLines.map((line, i) => (
                  <li key={`${i}-${line}`}>{line || "\u00a0"}</li>
                ))}
              </ul>
            ) : (
              <p className="uc__scale-empty">
                {input.trim() && scale === null
                  ? "Enter a scale amount like 2 or 1/2."
                  : "Your scaled ingredients will show up here."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <section className="uc__section">
      <button
        type="button"
        className="uc__section-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>Scale a recipe</span>
        <svg
          className={`uc__chevron ${open ? "uc__chevron--open" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && content}
    </section>
  );
}
