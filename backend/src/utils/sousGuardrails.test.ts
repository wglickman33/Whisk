import { describe, it, expect } from "vitest";
import { isSousOffTopic } from "./sousGuardrails.js";

describe("isSousOffTopic", () => {
  it("flags general knowledge that is outside the kitchen", () => {
    expect(isSousOffTopic("Who was the last president?")).toBe(true);
    expect(isSousOffTopic("How do I file my taxes?")).toBe(true);
    expect(isSousOffTopic("What is the current US president?")).toBe(true);
    expect(isSousOffTopic("Write me a python script")).toBe(true);
  });

  it("allows cooking, recipes, substitutes, and lists", () => {
    expect(isSousOffTopic("Help me make a different salmon recipe similar to this one")).toBe(
      false
    );
    expect(isSousOffTopic("How do I brown butter?")).toBe(false);
    expect(isSousOffTopic("What's on my shopping list?")).toBe(false);
    expect(isSousOffTopic("What can I use instead of heavy cream?")).toBe(false);
  });
});
