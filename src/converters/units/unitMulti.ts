import { convert, getUnitsForCategory, type UnitCategory } from "./unitUtils";
import { formatUnitOutput } from "./unitInput";

export type MultiConvertRow = {
  unit: string;
  value: number;
  formatted: string;
};

export function getMultiConvertRows(
  value: number,
  category: UnitCategory,
  fromUnit: string
): MultiConvertRow[] {
  return getUnitsForCategory(category).map((unit) => {
    const converted = convert(value, category, fromUnit, unit);
    return {
      unit,
      value: converted,
      formatted: formatUnitOutput(converted),
    };
  });
}

export function getCategoryHint(category: UnitCategory): string {
  const hints: Record<UnitCategory, string> = {
    volume: "Example: type 1, pick cups and ml, then click Convert.",
    weight: "Example: type 4, pick oz and g, then click Convert.",
    length: "Example: type 5, pick ft and m, then click Convert.",
    area: "Example: type 100, pick ft² and m², then click Convert.",
    time: "Example: type 90, pick min and h, then click Convert.",
    speed: "Example: type 60, pick mph and km/h, then click Convert.",
    pressure: "Example: type 32, pick psi and bar, then click Convert.",
    energy: "Example: type 200, pick kcal and kJ, then click Convert.",
    data: "Uses binary units (1 MB = 1024 KB). Click Convert to calculate.",
    temp: "Example: type 350, pick °F and °C, then click Convert.",
  };
  return hints[category];
}
