/** Format a quantity for display (e.g. 0.5 → "½", 1.5 → "1½") */
export function formatQuantity(q: number): string {
  if (q === 0) return "0";
  const isNegative = q < 0;
  const abs = Math.abs(q);
  const whole = Math.floor(abs);
  const frac = abs - whole;

  const fracStr =
    frac < 0.02
      ? ""
      : frac >= 0.98
        ? "1"
        : Math.abs(frac - 0.25) < 0.02
          ? "¼"
          : Math.abs(frac - 0.33) < 0.03
            ? "⅓"
            : Math.abs(frac - 0.5) < 0.02
              ? "½"
              : Math.abs(frac - 0.67) < 0.03
                ? "⅔"
                : Math.abs(frac - 0.75) < 0.02
                  ? "¾"
                  : frac.toFixed(2).replace(/\.?0+$/, "");

  const wholeStr = whole > 0 ? String(whole) : "";
  const combined = wholeStr && fracStr ? `${wholeStr} ${fracStr}` : wholeStr || fracStr;
  return isNegative ? `-${combined}` : combined;
}
