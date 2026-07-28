import { useMemo, useState } from "react";
import type { UnitCategory } from "../../../converters/units/unitUtils";
import { convertBatchLines } from "../../../converters/units/unitBatch";

type Props = {
  category: UnitCategory;
  toUnit: string;
  embedded?: boolean;
};

const PLACEHOLDER = `2 cups flour
1/2 tsp salt
250 ml milk`;

export function UnitConverterBatch({ category, toUnit, embedded = false }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(embedded);

  const results = useMemo(
    () => convertBatchLines(input, category, toUnit),
    [input, category, toUnit]
  );

  const hasInput = input.trim().length > 0;

  const content = (
    <div className="uc__batch">
      <p className="uc__help-text">
        Put one ingredient or measurement on each line. Everything converts to{" "}
        <strong>{toUnit}</strong>.
      </p>
      <textarea
        className="uc__scale-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={5}
        spellCheck={false}
        aria-label="List of measurements to convert"
      />
      {hasInput && (
        <ul className="uc__batch-results">
          {results.map((row, i) => (
            <li key={`${i}-${row.input}`} className={row.error ? "uc__batch-row--error" : ""}>
              <span className="uc__batch-in">{row.input}</span>
              <span className="uc__batch-arrow">→</span>
              <span className="uc__batch-out">
                {row.output ?? row.error ?? "Could not read this line"}
              </span>
            </li>
          ))}
        </ul>
      )}
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
        <span>Convert a list</span>
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
