import { scaleRecipeText, parseScaleMultiplier } from "../../converters/units/recipeScale";

export interface ScaleResult {
  ok: boolean;
  lines?: string[];
  multiplier?: number;
  error?: string;
}

export function scaleByServings(
  text: string,
  originalServings: string,
  targetServings: string
): ScaleResult {
  const from = parseScaleMultiplier(originalServings);
  const to = parseScaleMultiplier(targetServings);

  if (from === null) return { ok: false, error: "Enter a valid original serving count." };
  if (to === null) return { ok: false, error: "Enter a valid target serving count." };

  const multiplier = to / from;
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Paste your ingredient list first." };

  return {
    ok: true,
    multiplier,
    lines: scaleRecipeText(trimmed, multiplier),
  };
}

export function scaleByMultiplier(text: string, multiplierRaw: string): ScaleResult {
  const multiplier = parseScaleMultiplier(multiplierRaw);
  if (multiplier === null) return { ok: false, error: "Enter a valid multiplier (e.g. 2 or 1.5)." };

  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Paste your ingredient list first." };

  return {
    ok: true,
    multiplier,
    lines: scaleRecipeText(trimmed, multiplier),
  };
}
