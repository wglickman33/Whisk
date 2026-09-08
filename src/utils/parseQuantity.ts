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

function parseFractionPair(numerator: number, denominator: number, sign: 1 | -1): number | null {
  if (denominator === 0 || !Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return null;
  }
  return sign * (Math.abs(numerator) / Math.abs(denominator));
}

/** Parse a quantity string (e.g. "1/2", "1 1/3", "½") into a number. Empty string → 0. Invalid → null. */
export function parseQuantity(input: string): number | null {
  const raw = input.trim();
  if (!raw) return 0;

  if (Object.prototype.hasOwnProperty.call(UNICODE_FRACTIONS, raw)) {
    return UNICODE_FRACTIONS[raw];
  }

  const mixedUnicode = raw.match(/^(-?\d+)\s+([¼½¾⅓⅔⅛⅜⅝⅞])$/);
  if (mixedUnicode) {
    const whole = Number(mixedUnicode[1]);
    const frac = UNICODE_FRACTIONS[mixedUnicode[2]];
    if (!Number.isFinite(whole) || frac === undefined) return null;
    return whole + (whole < 0 ? -frac : frac);
  }

  const mixedAscii = raw.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixedAscii) {
    const whole = Number(mixedAscii[1]);
    const numerator = Number(mixedAscii[2]);
    const denominator = Number(mixedAscii[3]);
    if (!Number.isFinite(whole)) return null;
    const sign: 1 | -1 = whole < 0 ? -1 : 1;
    const fraction = parseFractionPair(numerator, denominator, sign);
    if (fraction === null) return null;
    return whole + fraction;
  }

  const simpleAscii = raw.match(/^(-?\d+)\/(\d+)$/);
  if (simpleAscii) {
    const numerator = Number(simpleAscii[1]);
    const denominator = Number(simpleAscii[2]);
    const sign: 1 | -1 = numerator < 0 ? -1 : 1;
    return parseFractionPair(numerator, denominator, sign);
  }

  const decimal = Number(raw);
  if (!Number.isNaN(decimal) && Number.isFinite(decimal)) {
    return decimal;
  }

  return null;
}
