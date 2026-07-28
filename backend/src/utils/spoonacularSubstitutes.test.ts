import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseSubstitutesPayload,
  fetchSpoonacularSubstitutes,
  SPOONACULAR_SUBSTITUTES_URL,
} from "./spoonacularSubstitutes.js";

describe("parseSubstitutesPayload", () => {
  it("returns trimmed string substitutes capped at 20", () => {
    const subs = Array.from({ length: 25 }, (_, i) => `  sub ${i}  `);
    expect(parseSubstitutesPayload({ substitutes: subs })).toHaveLength(20);
    expect(parseSubstitutesPayload({ substitutes: subs })[0]).toBe("sub 0");
  });

  it("filters non-strings and blank entries", () => {
    expect(
      parseSubstitutesPayload({
        substitutes: ["valid", "", "  ", 42, null, "also valid"],
      })
    ).toEqual(["valid", "also valid"]);
  });

  it("returns empty for missing or invalid payloads", () => {
    expect(parseSubstitutesPayload(null)).toEqual([]);
    expect(parseSubstitutesPayload(undefined)).toEqual([]);
    expect(parseSubstitutesPayload({})).toEqual([]);
    expect(parseSubstitutesPayload({ substitutes: "not-array" })).toEqual([]);
  });
});

describe("fetchSpoonacularSubstitutes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calls Spoonacular with ingredient name and api key", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ substitutes: ["yogurt"] }),
    });

    const result = await fetchSpoonacularSubstitutes("sour cream", {
      apiKey: "test-key",
      fetchFn,
    });

    expect(result).toEqual(["yogurt"]);
    expect(fetchFn).toHaveBeenCalledOnce();
    const calledUrl = fetchFn.mock.calls[0][0] as string;
    expect(calledUrl.startsWith(SPOONACULAR_SUBSTITUTES_URL)).toBe(true);
    expect(calledUrl).toContain("ingredientName=sour+cream");
    expect(calledUrl).toContain("apiKey=test-key");
  });

  it("returns empty on non-ok response", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 402 });
    const result = await fetchSpoonacularSubstitutes("milk", {
      apiKey: "test-key",
      fetchFn,
    });
    expect(result).toEqual([]);
  });

  it("returns empty on network error", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("network"));
    const result = await fetchSpoonacularSubstitutes("milk", {
      apiKey: "test-key",
      fetchFn,
    });
    expect(result).toEqual([]);
  });

  it("returns empty on timeout abort", async () => {
    const fetchFn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }) as typeof fetch;

    const promise = fetchSpoonacularSubstitutes("milk", {
      apiKey: "test-key",
      fetchFn,
      timeoutMs: 100,
    });

    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toEqual([]);
  });

  it("returns empty when Spoonacular reports no substitutes", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ substitutes: [], status: "failure" }),
    });
    const result = await fetchSpoonacularSubstitutes("unicorn dust", {
      apiKey: "test-key",
      fetchFn,
    });
    expect(result).toEqual([]);
  });
});
