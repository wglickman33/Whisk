import { useState } from "react";
import type { UnitCategory } from "../../../converters/units/unitUtils";
import type { FavoritePair, SavedConversion } from "../../../converters/units/unitStorage";
import { UnitConverterHistory } from "./UnitConverterHistory";
import { UnitConverterMultiTable } from "./UnitConverterMultiTable";
import { UnitConverterBatch } from "./UnitConverterBatch";
import { UnitConverterRecipeScale } from "./UnitConverterRecipeScale";

type ToolId = "saved" | "all-units" | "batch" | "scale";

type Props = {
  category: UnitCategory;
  toUnit: string;
  fromUnit: string;
  parsedInput: number | null;
  showKitchenTools: boolean;
  recent: SavedConversion[];
  favorites: FavoritePair[];
  isCurrentFavorite: boolean;
  onToggleFavorite: () => void;
  onApplyRecent: (entry: SavedConversion) => void;
  onApplyFavorite: (entry: FavoritePair) => void;
  onRemoveFavorite: (id: string) => void;
};

const TOOLS: { id: ToolId; title: string; kitchenOnly?: boolean }[] = [
  { id: "saved", title: "Saved" },
  { id: "all-units", title: "All units" },
  { id: "batch", title: "Convert list" },
  { id: "scale", title: "Scale recipe", kitchenOnly: true },
];

export function UnitConverterSidebar(props: Props) {
  const { showKitchenTools, category, toUnit, fromUnit, parsedInput } = props;
  const visibleTools = TOOLS.filter((t) => !t.kitchenOnly || showKitchenTools);
  const [activeTool, setActiveTool] = useState<ToolId>("all-units");

  const safeActive = visibleTools.some((t) => t.id === activeTool)
    ? activeTool
    : visibleTools[0]?.id ?? "all-units";

  return (
    <div className="uc__sidebar-tools">
      <h3 className="uc__sidebar-title">Tools</h3>
      <div className="uc__sidebar-tabs" role="tablist" aria-label="Converter tools">
        {visibleTools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            role="tab"
            aria-selected={safeActive === tool.id}
            className={`uc__sidebar-tab ${safeActive === tool.id ? "uc__sidebar-tab--active" : ""}`}
            onClick={() => setActiveTool(tool.id)}
          >
            {tool.title}
          </button>
        ))}
      </div>

      <div className="uc__sidebar-panel" role="tabpanel">
        {safeActive === "saved" && (
          <UnitConverterHistory
            category={category}
            recent={props.recent}
            favorites={props.favorites}
            isCurrentFavorite={props.isCurrentFavorite}
            onToggleFavorite={props.onToggleFavorite}
            onApplyRecent={props.onApplyRecent}
            onApplyFavorite={props.onApplyFavorite}
            onRemoveFavorite={props.onRemoveFavorite}
          />
        )}

        {safeActive === "all-units" && (
          <UnitConverterMultiTable
            category={category}
            fromUnit={fromUnit}
            value={parsedInput}
            highlightUnit={toUnit}
          />
        )}

        {safeActive === "batch" && (
          <UnitConverterBatch category={category} toUnit={toUnit} embedded />
        )}

        {safeActive === "scale" && showKitchenTools && (
          <UnitConverterRecipeScale embedded />
        )}
      </div>
    </div>
  );
}
