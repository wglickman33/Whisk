import { describe, it, expect } from "vitest";
import { diffLines, formatDiffText, diffSummary } from "./textDiff";

describe("textDiff", () => {
  it("detects added and removed lines", () => {
    const lines = diffLines("alpha\nbeta", "alpha\ngamma");
    expect(lines.some((l) => l.type === "remove" && l.text === "beta")).toBe(true);
    expect(lines.some((l) => l.type === "add" && l.text === "gamma")).toBe(true);
    expect(lines.some((l) => l.type === "same" && l.text === "alpha")).toBe(true);
  });

  it("formats unified diff text", () => {
    const text = formatDiffText([
      { type: "same", text: "keep" },
      { type: "remove", text: "old" },
      { type: "add", text: "new" },
    ]);
    expect(text).toContain("  keep");
    expect(text).toContain("- old");
    expect(text).toContain("+ new");
  });

  it("summarizes changes", () => {
    const summary = diffSummary([
      { type: "same", text: "a" },
      { type: "add", text: "b" },
      { type: "remove", text: "c" },
    ]);
    expect(summary).toEqual({ added: 1, removed: 1, unchanged: 1 });
  });
});
