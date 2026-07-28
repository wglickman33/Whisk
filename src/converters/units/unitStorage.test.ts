import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addRecentConversion,
  addFavoritePair,
  getRecentConversions,
  getFavoritePairs,
  isFavoritePair,
  removeFavoritePair,
} from "./unitStorage";

describe("unitStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("crypto", {
      randomUUID: () => "test-id-1",
    });
  });

  it("stores recent conversions with a max of five", () => {
    for (let i = 0; i < 7; i += 1) {
      addRecentConversion({
        category: "volume",
        fromUnit: "cup",
        toUnit: "ml",
        input: String(i),
      });
    }
    expect(getRecentConversions()).toHaveLength(5);
  });

  it("deduplicates recent conversions", () => {
    addRecentConversion({ category: "volume", fromUnit: "cup", toUnit: "ml", input: "1" });
    addRecentConversion({ category: "volume", fromUnit: "cup", toUnit: "ml", input: "1" });
    expect(getRecentConversions()).toHaveLength(1);
  });

  it("adds and removes favorites", () => {
    addFavoritePair({ category: "temp", fromUnit: "°F", toUnit: "°C" });
    expect(isFavoritePair("temp", "°F", "°C")).toBe(true);
    removeFavoritePair("test-id-1");
    expect(getFavoritePairs()).toHaveLength(0);
  });

  it("does not duplicate favorites", () => {
    addFavoritePair({ category: "weight", fromUnit: "oz", toUnit: "g" });
    addFavoritePair({ category: "weight", fromUnit: "oz", toUnit: "g" });
    expect(getFavoritePairs()).toHaveLength(1);
  });
});
