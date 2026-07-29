import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  applyEffectiveTheme,
  resolveEffectiveTheme,
  subscribeSystemTheme,
} from "./theme";

describe("resolveEffectiveTheme", () => {
  it("returns light or dark for pinned preferences", () => {
    expect(resolveEffectiveTheme("light")).toBe("light");
    expect(resolveEffectiveTheme("dark")).toBe("dark");
  });

  it("follows prefers-color-scheme when auto", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }))
    );
    expect(resolveEffectiveTheme("auto")).toBe("dark");

    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false }))
    );
    expect(resolveEffectiveTheme("auto")).toBe("light");
  });
});

describe("applyEffectiveTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("sets data-theme for dark", () => {
    applyEffectiveTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("removes data-theme for light", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    applyEffectiveTheme("light");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});

describe("subscribeSystemTheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers and cleans up change listener", () => {
    const removeListener = vi.fn();
    const addListener = vi.fn();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: addListener,
        removeEventListener: removeListener,
      }))
    );

    const onChange = vi.fn();
    const unsubscribe = subscribeSystemTheme(onChange);
    expect(addListener).toHaveBeenCalledWith("change", onChange);

    unsubscribe();
    expect(removeListener).toHaveBeenCalledWith("change", onChange);
  });
});
