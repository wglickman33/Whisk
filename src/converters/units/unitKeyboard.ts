const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export type UnitConverterKeyAction = "focus-input" | "swap-units" | "none";

export function getUnitConverterKeyAction(
  key: string,
  target: EventTarget | null
): UnitConverterKeyAction {
  if (target instanceof HTMLElement && TYPING_TAGS.has(target.tagName)) {
    return "none";
  }

  if (key === "Enter") return "focus-input";
  if (key === "s" || key === "S") return "swap-units";
  return "none";
}
