import type { UnitCategory } from "./unitUtils";
import { getUnitsForCategory, convert } from "./unitUtils";
import { extractLeadingQuantity } from "./recipeScale";
import { formatUnitOutput } from "./unitInput";

const UNIT_ALIASES: Record<string, string> = {
  cups: "cup",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  ounces: "oz",
  ounce: "oz",
  pounds: "lb",
  pound: "lb",
  grams: "g",
  gram: "g",
  kilograms: "kg",
  kilogram: "kg",
  milliliters: "ml",
  milliliter: "ml",
  liters: "l",
  liter: "l",
  feet: "ft",
  foot: "ft",
  inches: "in",
  inch: "in",
  miles: "mi",
  mile: "mi",
  meters: "m",
  meter: "m",
  centimeters: "cm",
  centimeter: "cm",
};

function normalizeUnitToken(token: string, category: UnitCategory): string | null {
  const lower = token.toLowerCase().trim();
  const units = getUnitsForCategory(category);
  const canonical = units.find((u) => u.toLowerCase() === lower);
  if (canonical) return canonical;
  const alias = UNIT_ALIASES[lower];
  if (alias && units.includes(alias)) return alias;
  return null;
}

export function parseConversionLine(
  line: string,
  category: UnitCategory
): { value: number; fromUnit: string; remainder: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parsed = extractLeadingQuantity(trimmed);
  if (!parsed) return null;

  const units = [...getUnitsForCategory(category)].sort((a, b) => b.length - a.length);
  const restLower = parsed.rest.toLowerCase();

  for (const unit of units) {
    const unitLower = unit.toLowerCase();
    if (restLower === unitLower) {
      return { value: parsed.quantity, fromUnit: unit, remainder: "" };
    }
    if (restLower.startsWith(`${unitLower} `)) {
      return {
        value: parsed.quantity,
        fromUnit: unit,
        remainder: parsed.rest.slice(unit.length).trim(),
      };
    }
  }

  const firstToken = parsed.rest.split(/\s+/)[0] ?? "";
  const normalized = normalizeUnitToken(firstToken, category);
  if (normalized) {
    const remainder = parsed.rest.slice(firstToken.length).trim();
    return { value: parsed.quantity, fromUnit: normalized, remainder };
  }

  return null;
}

export type BatchConversionResult = {
  input: string;
  output: string | null;
  error?: string;
};

export function convertBatchLines(
  text: string,
  category: UnitCategory,
  toUnit: string
): BatchConversionResult[] {
  return text.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return { input: line, output: null };

    const parsed = parseConversionLine(trimmed, category);
    if (!parsed) {
      return { input: trimmed, output: null, error: "Could not parse quantity and unit" };
    }

    const result = convert(parsed.value, category, parsed.fromUnit, toUnit);
    const formatted = `${formatUnitOutput(result)} ${toUnit}`;
    const output = parsed.remainder ? `${formatted} · ${parsed.remainder}` : formatted;
    return { input: trimmed, output };
  });
}
