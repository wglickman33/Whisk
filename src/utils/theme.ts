export type ThemePreference = "light" | "dark" | "auto";
export type EffectiveTheme = "light" | "dark";

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "auto";
}

export function resolveEffectiveTheme(preference: ThemePreference): EffectiveTheme {
  if (preference === "auto") {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return "light";
    }
    return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
  }
  return preference;
}

export function applyEffectiveThemeToDom(effective: EffectiveTheme): void {
  if (typeof document === "undefined") return;
  if (effective === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function applyEffectiveTheme(preference: ThemePreference): EffectiveTheme {
  const effective = resolveEffectiveTheme(preference);
  applyEffectiveThemeToDom(effective);
  return effective;
}

export function subscribeSystemTheme(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(SYSTEM_DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
