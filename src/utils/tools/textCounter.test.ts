import { describe, it, expect } from "vitest";
import { countText } from "./textCounter";

describe("countText", () => {
  it("counts words and lines", () => {
    const stats = countText("Hello world\nSecond line.");
    expect(stats.words).toBe(4);
    expect(stats.lines).toBe(2);
    expect(stats.characters).toBeGreaterThan(0);
  });

  it("returns zeros for empty input", () => {
    expect(countText("")).toEqual({
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      sentences: 0,
      paragraphs: 0,
    });
  });
});
