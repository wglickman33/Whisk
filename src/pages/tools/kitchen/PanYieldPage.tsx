import { useState, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { COMMON_PANS, panYieldFromIds } from "../../../utils/tools/panYield";
import "../shared/KitchenTool.scss";

export function PanYieldPage() {
  const [fromPan, setFromPan] = useState("9x13");
  const [toPan, setToPan] = useState("8x8");

  const result = useMemo(() => panYieldFromIds(fromPan, toPan), [fromPan, toPan]);
  const activeStep = result.ok ? 2 : 1;

  return (
    <ToolPage toolId="pan-yield" activeStep={activeStep}>
      <div className="kitchen-tool">
        <p className="kitchen-tool__hint">
          Compare pan sizes to see how much to scale your recipe. Baking time changes with thickness.
        </p>

        <div className="kitchen-tool__row">
          <label className="kitchen-tool__field">
            <span>Recipe pan</span>
            <select value={fromPan} onChange={(e) => setFromPan(e.target.value)}>
              {COMMON_PANS.map((pan) => (
                <option key={pan.id} value={pan.id}>
                  {pan.label}
                </option>
              ))}
            </select>
          </label>
          <label className="kitchen-tool__field">
            <span>Your pan</span>
            <select value={toPan} onChange={(e) => setToPan(e.target.value)}>
              {COMMON_PANS.map((pan) => (
                <option key={pan.id} value={pan.id}>
                  {pan.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {result.ok && result.summary && (
          <div className="kitchen-tool__result" aria-live="polite">
            {result.summary}
          </div>
        )}

        <CopyField
          id="pan-output"
          label="Scaling guidance"
          value={result.ok ? result.summary! : ""}
          readOnly
          error={result.ok ? undefined : result.error}
          rows={4}
          placeholder="Pick pans to see scaling guidance"
        />
      </div>
    </ToolPage>
  );
}
