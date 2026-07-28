import { describe, it, expect } from "vitest";
import { getUnitConverterKeyAction } from "./unitKeyboard";

describe("getUnitConverterKeyAction", () => {
  it("maps Enter to focus-input when not typing", () => {
    expect(getUnitConverterKeyAction("Enter", document.body)).toBe("focus-input");
  });

  it("maps S to swap-units when not typing", () => {
    expect(getUnitConverterKeyAction("s", document.body)).toBe("swap-units");
    expect(getUnitConverterKeyAction("S", document.body)).toBe("swap-units");
  });

  it("ignores shortcuts while typing in inputs", () => {
    const input = document.createElement("input");
    expect(getUnitConverterKeyAction("s", input)).toBe("none");
    expect(getUnitConverterKeyAction("Enter", input)).toBe("none");
  });

  it("ignores shortcuts while using selects", () => {
    const select = document.createElement("select");
    expect(getUnitConverterKeyAction("s", select)).toBe("none");
  });

  it("returns none for unrelated keys", () => {
    expect(getUnitConverterKeyAction("a", document.body)).toBe("none");
  });
});
