import { describe, it, expect, vi } from "vitest";
import { resolveSubstitutes } from "./resolveSubstitutes";

describe("resolveSubstitutes", () => {
  it("returns API results when the API has substitutes", async () => {
    const fetchApi = vi.fn().mockResolvedValue(["Greek yogurt", "crème fraîche"]);
    const findFallback = vi.fn().mockReturnValue(["fallback only"]);

    const result = await resolveSubstitutes("sour cream", fetchApi, findFallback);

    expect(result).toEqual({
      substitutes: ["Greek yogurt", "crème fraîche"],
      noSubstitute: false,
      source: "api",
    });
    expect(findFallback).not.toHaveBeenCalled();
  });

  it("uses fallback when the API returns empty", async () => {
    const fetchApi = vi.fn().mockResolvedValue([]);
    const findFallback = vi.fn().mockReturnValue(["tamari (1:1, gluten-free)"]);

    const result = await resolveSubstitutes("soy sauce", fetchApi, findFallback);

    expect(result).toEqual({
      substitutes: ["tamari (1:1, gluten-free)"],
      noSubstitute: false,
      source: "fallback",
    });
    expect(findFallback).toHaveBeenCalledWith("soy sauce");
  });

  it("uses fallback when the API throws", async () => {
    const fetchApi = vi.fn().mockRejectedValue(new Error("401"));
    const findFallback = vi.fn().mockReturnValue(["melted butter (1:1)"]);

    const result = await resolveSubstitutes("vegetable oil", fetchApi, findFallback);

    expect(result).toEqual({
      substitutes: ["melted butter (1:1)"],
      noSubstitute: false,
      source: "fallback",
    });
  });

  it("marks noSubstitute when API and fallback are both empty", async () => {
    const fetchApi = vi.fn().mockResolvedValue([]);
    const findFallback = vi.fn().mockReturnValue([]);

    const result = await resolveSubstitutes("chicken breast", fetchApi, findFallback);

    expect(result).toEqual({
      substitutes: [],
      noSubstitute: true,
      source: "none",
    });
  });

  it("does not call fallback when API returns at least one result", async () => {
    const fetchApi = vi.fn().mockResolvedValue(["one option"]);
    const findFallback = vi.fn();

    await resolveSubstitutes("butter", fetchApi, findFallback);

    expect(findFallback).not.toHaveBeenCalled();
  });
});
