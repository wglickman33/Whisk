import { useState, useEffect } from "react";
import {
  type UnitCategory,
  convert,
  getUnitsForCategory,
  getDefaultFromUnit,
  getDefaultToUnit,
  CATEGORY_LABELS,
  UNIT_CATEGORIES,
} from "../../converters/utils/unitUtils";
import "./UnitConverter.scss";

function formatOutput(value: number): string {
  if (Math.abs(value) >= 1e12 || (Math.abs(value) < 1e-6 && value !== 0)) {
    return value.toExponential(4);
  }
  const fixed = value.toFixed(6).replace(/\.?0+$/, "");
  return parseFloat(fixed).toLocaleString();
}

export function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>("volume");
  const [fromUnit, setFromUnit] = useState("cup");
  const [toUnit, setToUnit] = useState("ml");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<number | null>(null);

  const units = getUnitsForCategory(category);

  useEffect(() => {
    const val = parseFloat(input);
    if (Number.isNaN(val) || input === "" || input === "-") {
      setOutput(null);
      return;
    }
    setOutput(convert(val, category, fromUnit, toUnit));
  }, [input, fromUnit, toUnit, category]);

  const handleCategoryChange = (c: UnitCategory) => {
    setCategory(c);
    setFromUnit(getDefaultFromUnit(c));
    setToUnit(getDefaultToUnit(c));
    setInput("");
    setOutput(null);
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="uc">
      <header className="uc__header">
        <h1 className="uc__title">Unit Converter</h1>
        <p className="uc__tagline">
          Convert anything — volume, weight, length, area, time, speed, pressure, energy, data, temperature.
        </p>
      </header>

      <div className="uc__panel">
        <div className="uc__categories" role="tablist">
          {UNIT_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              className={`uc__cat ${category === c ? "uc__cat--active" : ""}`}
              onClick={() => handleCategoryChange(c)}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="uc__workspace">
          <div className="uc__field uc__field--from">
            <label className="uc__label">From</label>
            <div className="uc__row">
              <input
                type="text"
                inputMode="decimal"
                className="uc__input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="0"
                autoComplete="off"
              />
              <select
                className="uc__select"
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                aria-label="From unit"
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
            type="button"
            className="uc__swap"
            onClick={swapUnits}
            aria-label="Swap units"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4M7 4L3 8M7 4l4 4" />
              <path d="M17 8v12M17 20l4-4M17 20l-4-4" />
            </svg>
          </button>

          <div className="uc__field uc__field--to">
            <label className="uc__label">To</label>
            <div className="uc__row uc__row--result">
              <output className="uc__output">
                {output != null ? formatOutput(output) : "—"}
              </output>
              <select
                className="uc__select"
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                aria-label="To unit"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
