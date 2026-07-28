import { useState, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { scaleByServings } from "../../../utils/tools/ingredientScale";
import "../shared/KitchenTool.scss";

export function IngredientScalePage() {
  const [ingredients, setIngredients] = useState("2 cups flour\n1/2 tsp salt\n1 tbsp butter");
  const [originalServings, setOriginalServings] = useState("4");
  const [targetServings, setTargetServings] = useState("6");

  const result = useMemo(
    () => scaleByServings(ingredients, originalServings, targetServings),
    [ingredients, originalServings, targetServings]
  );

  const output = result.ok ? result.lines!.join("\n") : "";
  const activeStep = result.ok ? 2 : ingredients.trim() ? 1 : 0;

  return (
    <ToolPage toolId="ingredient-scale" activeStep={activeStep}>
      <div className="kitchen-tool">
        <p className="kitchen-tool__hint">
          Paste one ingredient per line. Lines starting with a number will be scaled.
        </p>

        <div className="kitchen-tool__row">
          <label className="kitchen-tool__field">
            <span>Original servings</span>
            <input
              type="text"
              inputMode="decimal"
              value={originalServings}
              onChange={(e) => setOriginalServings(e.target.value)}
            />
          </label>
          <label className="kitchen-tool__field">
            <span>Target servings</span>
            <input
              type="text"
              inputMode="decimal"
              value={targetServings}
              onChange={(e) => setTargetServings(e.target.value)}
            />
          </label>
          {result.ok && result.multiplier !== undefined && (
            <span className="kitchen-tool__hint">
              Scale factor: {result.multiplier.toFixed(2)}×
            </span>
          )}
        </div>

        <CopyField
          id="scale-input"
          label="Your ingredients"
          value={ingredients}
          onChange={setIngredients}
          placeholder="2 cups flour&#10;1/2 tsp salt"
          rows={8}
        />

        <CopyField
          id="scale-output"
          label={result.ok ? "Scaled ingredients" : "Result"}
          value={output}
          readOnly
          error={result.ok ? undefined : result.error}
          rows={8}
          placeholder={ingredients.trim() ? "Fix errors above to see output" : "Scaled list will appear here"}
        />
      </div>
    </ToolPage>
  );
}
