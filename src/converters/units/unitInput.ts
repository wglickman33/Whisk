const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

function parseFractionToken(token: string): number | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  if (trimmed in UNICODE_FRACTIONS) return UNICODE_FRACTIONS[trimmed];

  const slashMatch = trimmed.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (slashMatch) {
    const numerator = Number(slashMatch[1]);
    const denominator = Number(slashMatch[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return null;
    }
    return numerator / denominator;
  }

  if (/^-?(\d+\.\d*|\.\d+)$/.test(trimmed)) {
    const value = Number(trimmed);
    return Number.isFinite(value) ? value : null;
  }

  if (/^-?\d+$/.test(trimmed)) {
    const value = Number(trimmed);
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

export type UnitInputFeedback = "empty" | "valid" | "partial" | "invalid";

export function getUnitInputFeedback(raw: string): UnitInputFeedback {
  const trimmed = raw.trim();
  if (!trimmed) return "empty";
  if (parseUnitInput(trimmed) !== null) return "valid";
  if (trimmed === "-" || trimmed === "." || trimmed.endsWith("/") || trimmed.endsWith(".")) {
    return "partial";
  }
  if (/^[-.\d\s/¼½¾⅓⅔⅛⅜⅝⅞]+$/.test(trimmed)) return "partial";
  return "invalid";
}

/** Returns null for empty, incomplete, or invalid input. */
export function parseUnitInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-" || trimmed === ".") return null;

  const normalized = trimmed.replace(/(\d)([¼½¾⅓⅔⅛⅜⅝⅞])/g, "$1 $2");
  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length === 1) return parseFractionToken(parts[0]);

  if (parts.length === 2) {
    const whole = parseFractionToken(parts[0]);
    const fraction = parseFractionToken(parts[1]);
    if (whole === null || fraction === null) return null;
    if (!Number.isInteger(whole)) return null;

    const sign = whole < 0 ? -1 : 1;
    return whole + sign * Math.abs(fraction);
  }

  return null;
}

export function formatUnitOutput(value: number): string {
  if (Math.abs(value) >= 1e12 || (Math.abs(value) < 1e-6 && value !== 0)) {
    return value.toExponential(4);
  }
  const fixed = value.toFixed(6).replace(/\.?0+$/, "");
  return parseFloat(fixed).toLocaleString();
}

export function formatCopyText(value: number, unit: string): string {
  return `${formatUnitOutput(value)} ${unit}`;
}
