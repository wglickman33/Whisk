import { useMemo } from "react";
import type { UnitCategory } from "../../../converters/units/unitUtils";
import { getMultiConvertRows } from "../../../converters/units/unitMulti";

type Props = {
  category: UnitCategory;
  fromUnit: string;
  value: number | null;
  highlightUnit: string;
};

export function UnitConverterMultiTable({ category, fromUnit, value, highlightUnit }: Props) {
  const rows = useMemo(() => {
    if (value === null) return [];
    return getMultiConvertRows(value, category, fromUnit);
  }, [value, category, fromUnit]);

  if (rows.length === 0) {
    return (
      <div className="uc__multi uc__multi--empty">
        <p>Enter an amount in the converter above to compare it across every unit.</p>
      </div>
    );
  }

  return (
    <div className="uc__multi">
      <p className="uc__help-text uc__help-text--tight">
        Your amount in every {category} unit. The unit you picked as the result is highlighted.
      </p>
      <ul className="uc__multi-list">
        {rows.map((row) => (
          <li
            key={row.unit}
            className={`uc__multi-row ${row.unit === highlightUnit ? "uc__multi-row--active" : ""}`}
          >
            <span className="uc__multi-unit">{row.unit}</span>
            <span className="uc__multi-value">{row.formatted}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
