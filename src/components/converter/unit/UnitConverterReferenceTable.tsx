import { useMemo } from "react";
import type { UnitCategory } from "../../../converters/units/unitUtils";
import { getReferenceTableRows } from "../../../converters/units/unitReference";

type Props = {
  category: UnitCategory;
  onApply?: (fromUnit: string, toUnit: string, amount: string) => void;
};

export function UnitConverterReferenceTable({ category, onApply }: Props) {
  const rows = useMemo(() => getReferenceTableRows(category), [category]);

  return (
    <div className="uc__ref-table-wrap">
      <h3 className="uc__sidebar-title">Quick reference</h3>
      <p className="uc__sidebar-desc">Common {category} conversions. Tap a row to use it.</p>
      <div className="uc__ref-table-scroll">
        <table className="uc__ref-table">
          <thead>
            <tr>
              <th scope="col">From</th>
              <th scope="col" aria-hidden />
              <th scope="col">Equals</th>
              <th scope="col">Unit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const [amount, ...fromParts] = row.fromLabel.split(" ");
              const fromUnit = fromParts.join(" ");
              return (
                <tr key={`${row.fromLabel}-${row.toLabel}`}>
                  <td>
                    {onApply ? (
                      <button
                        type="button"
                        className="uc__ref-row-btn"
                        onClick={() => onApply(fromUnit, row.toLabel, amount)}
                      >
                        {row.fromLabel}
                      </button>
                    ) : (
                      row.fromLabel
                    )}
                  </td>
                  <td className="uc__ref-eq" aria-hidden>
                    =
                  </td>
                  <td className="uc__ref-value">{row.value}</td>
                  <td className="uc__ref-unit">{row.toLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
