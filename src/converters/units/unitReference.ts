import type { UnitCategory } from "./unitUtils";
import { convert } from "./unitUtils";
import { formatUnitOutput } from "./unitInput";

export type UnitSystem = "us" | "metric";

export type ReferencePair = {
  amount: number;
  from: string;
  to: string;
};

export type ReferenceTableRow = {
  fromLabel: string;
  toLabel: string;
  value: string;
};

export const KITCHEN_CATEGORIES = new Set<UnitCategory>(["volume", "weight"]);

export const SYSTEM_DEFAULTS: Record<
  "volume" | "weight",
  Record<UnitSystem, { from: string; to: string }>
> = {
  volume: {
    us: { from: "cup", to: "tbsp" },
    metric: { from: "ml", to: "l" },
  },
  weight: {
    us: { from: "oz", to: "lb" },
    metric: { from: "g", to: "kg" },
  },
};

export function isKitchenCategory(category: UnitCategory): category is "volume" | "weight" {
  return KITCHEN_CATEGORIES.has(category);
}

export function getSystemDefaults(
  category: "volume" | "weight",
  system: UnitSystem
): { from: string; to: string } {
  return SYSTEM_DEFAULTS[category][system];
}

function formatRefAmount(amount: number): string {
  if (Number.isInteger(amount)) return String(amount);
  return String(amount).replace(/\.?0+$/, "");
}

export const REFERENCE_PAIRS: Record<UnitCategory, ReferencePair[]> = {
  volume: [
    { amount: 1, from: "cup", to: "ml" },
    { amount: 1, from: "cup", to: "tbsp" },
    { amount: 1, from: "tbsp", to: "tsp" },
    { amount: 1, from: "tbsp", to: "ml" },
    { amount: 1, from: "tsp", to: "ml" },
    { amount: 1, from: "fl oz", to: "ml" },
    { amount: 1, from: "pint", to: "cup" },
    { amount: 1, from: "quart", to: "cup" },
    { amount: 1, from: "gallon", to: "cup" },
    { amount: 1, from: "l", to: "cup" },
    { amount: 250, from: "ml", to: "cup" },
    { amount: 500, from: "ml", to: "cup" },
    { amount: 1, from: "dl", to: "ml" },
    { amount: 1, from: "cl", to: "ml" },
  ],
  weight: [
    { amount: 1, from: "oz", to: "g" },
    { amount: 1, from: "lb", to: "g" },
    { amount: 1, from: "lb", to: "oz" },
    { amount: 1, from: "kg", to: "lb" },
    { amount: 1, from: "kg", to: "g" },
    { amount: 100, from: "g", to: "oz" },
    { amount: 500, from: "g", to: "lb" },
    { amount: 1, from: "mg", to: "g" },
    { amount: 1, from: "ton", to: "lb" },
  ],
  length: [
    { amount: 1, from: "in", to: "cm" },
    { amount: 1, from: "ft", to: "m" },
    { amount: 1, from: "ft", to: "in" },
    { amount: 1, from: "yd", to: "ft" },
    { amount: 1, from: "mi", to: "km" },
    { amount: 1, from: "m", to: "cm" },
    { amount: 1, from: "km", to: "mi" },
    { amount: 1, from: "nm", to: "mi" },
  ],
  area: [
    { amount: 1, from: "ft²", to: "m²" },
    { amount: 1, from: "in²", to: "cm²" },
    { amount: 1, from: "acres", to: "hectares" },
    { amount: 1, from: "hectares", to: "acres" },
    { amount: 1, from: "yd²", to: "ft²" },
    { amount: 1, from: "km²", to: "hectares" },
  ],
  time: [
    { amount: 1, from: "min", to: "s" },
    { amount: 1, from: "h", to: "min" },
    { amount: 1, from: "d", to: "h" },
    { amount: 1, from: "week", to: "d" },
    { amount: 60, from: "s", to: "min" },
  ],
  speed: [
    { amount: 1, from: "mph", to: "km/h" },
    { amount: 1, from: "km/h", to: "mph" },
    { amount: 1, from: "knots", to: "mph" },
    { amount: 1, from: "m/s", to: "mph" },
    { amount: 60, from: "mph", to: "ft/s" },
  ],
  pressure: [
    { amount: 1, from: "psi", to: "bar" },
    { amount: 1, from: "atm", to: "psi" },
    { amount: 1, from: "bar", to: "kPa" },
    { amount: 1, from: "kPa", to: "Pa" },
  ],
  energy: [
    { amount: 1, from: "kcal", to: "kJ" },
    { amount: 1, from: "kWh", to: "kJ" },
    { amount: 1, from: "cal", to: "J" },
    { amount: 1000, from: "J", to: "kJ" },
  ],
  data: [
    { amount: 1, from: "KB", to: "B" },
    { amount: 1, from: "MB", to: "KB" },
    { amount: 1, from: "GB", to: "MB" },
    { amount: 1, from: "TB", to: "GB" },
    { amount: 1024, from: "MB", to: "GB" },
  ],
  temp: [
    { amount: 32, from: "°F", to: "°C" },
    { amount: 212, from: "°F", to: "°C" },
    { amount: 100, from: "°C", to: "°F" },
    { amount: 0, from: "°C", to: "K" },
    { amount: 98.6, from: "°F", to: "°C" },
  ],
};

export function getReferenceTableRows(category: UnitCategory): ReferenceTableRow[] {
  return REFERENCE_PAIRS[category].map((pair) => ({
    fromLabel: `${formatRefAmount(pair.amount)} ${pair.from}`,
    toLabel: pair.to,
    value: formatUnitOutput(convert(pair.amount, category, pair.from, pair.to)),
  }));
}

export const KITCHEN_QUICK_PICKS = {
  volume: [
    { label: "½ cup → tbsp", from: "cup", to: "tbsp", value: "1/2" },
    { label: "1 stick → tbsp", from: "cup", to: "tbsp", value: "1/2" },
    { label: "250 ml → cup", from: "ml", to: "cup", value: "250" },
  ],
  weight: [
    { label: "4 oz → g", from: "oz", to: "g", value: "4" },
    { label: "500 g → lb", from: "g", to: "lb", value: "500" },
    { label: "1 kg → oz", from: "kg", to: "oz", value: "1" },
  ],
} as const;
