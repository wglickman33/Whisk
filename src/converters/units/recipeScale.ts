import { formatQuantity } from "../../utils/formatQuantity";
import { parseUnitInput } from "./unitInput";

const QUANTITY_PATTERNS = [
  /^(-?\d+\s+\d+\s*\/\s*\d+)\s+(.+)$/,
  /^(-?\d+\s*[¼½¾⅓⅔⅛⅜⅝⅞])\s+(.+)$/,
  /^(-?\d+\s*\/\s*\d+)\s+(.+)$/,
  /^(-?\d+(?:\.\d+)?)\s+(.+)$/,
  /^([¼½¾⅓⅔⅛⅜⅝⅞])\s+(.+)$/,
];

export function extractLeadingQuantity(line: string): { quantity: number; rest: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  for (const pattern of QUANTITY_PATTERNS) {
    const match = trimmed.match(pattern);
    if (!match) continue;
    const quantity = parseUnitInput(match[1]);
    if (quantity !== null) {
      return { quantity, rest: match[2].trim() };
    }
  }
  return null;
}

export function scaleIngredientLine(line: string, multiplier: number): string {
  const trimmed = line.trim();
  if (!trimmed) return "";

  if (!Number.isFinite(multiplier) || multiplier <= 0) return trimmed;

  const parsed = extractLeadingQuantity(trimmed);
  if (!parsed) return trimmed;

  const scaled = parsed.quantity * multiplier;
  return `${formatQuantity(scaled)} ${parsed.rest}`;
}

export function scaleRecipeText(text: string, multiplier: number): string[] {
  return text
    .split("\n")
    .map((line) => scaleIngredientLine(line, multiplier));
}

export function parseScaleMultiplier(raw: string): number | null {
  const value = parseUnitInput(raw);
  if (value === null || value <= 0) return null;
  return value;
}
