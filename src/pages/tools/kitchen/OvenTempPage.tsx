import { useState, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { convertOvenTemp, formatOvenTempSummary, type TempUnit } from "../../../utils/tools/ovenTemp";
import "../shared/KitchenTool.scss";

export function OvenTempPage() {
  const [value, setValue] = useState("350");
  const [unit, setUnit] = useState<TempUnit>("F");

  const reading = useMemo(() => {
    const num = Number(value);
    if (!value.trim() || !Number.isFinite(num)) return null;
    return convertOvenTemp(num, unit);
  }, [value, unit]);

  const output = reading ? formatOvenTempSummary(reading) : "";
  const activeStep = reading ? 2 : value.trim() ? 1 : 0;

  return (
    <ToolPage toolId="oven-temp" activeStep={activeStep}>
      <div className="kitchen-tool">
        <div className="kitchen-tool__modes" role="group" aria-label="Temperature unit">
          <button
            type="button"
            className={`kitchen-tool__mode ${unit === "F" ? "kitchen-tool__mode--active" : ""}`}
            onClick={() => setUnit("F")}
          >
            Fahrenheit
          </button>
          <button
            type="button"
            className={`kitchen-tool__mode ${unit === "C" ? "kitchen-tool__mode--active" : ""}`}
            onClick={() => setUnit("C")}
          >
            Celsius
          </button>
        </div>

        <label className="kitchen-tool__field">
          <span>Oven temperature</span>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={unit === "F" ? "350" : "180"}
          />
        </label>

        {reading && (
          <div className="kitchen-tool__result" aria-live="polite">
            {output}
          </div>
        )}

        <CopyField
          id="oven-output"
          label="All conversions"
          value={output}
          readOnly
          rows={4}
          placeholder="Enter a temperature to see conversions"
        />
      </div>
    </ToolPage>
  );
}
