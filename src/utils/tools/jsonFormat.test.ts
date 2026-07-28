import { describe, it, expect } from "vitest";
import { formatJson, minifyJson } from "./jsonFormat";

describe("formatJson", () => {
  it("pretty-prints valid json", () => {
    const result = formatJson('{"a":1}');
    expect(result.ok).toBe(true);
    expect(result.output).toContain("\n");
  });

  it("rejects empty input", () => {
    expect(formatJson("").ok).toBe(false);
  });

  it("rejects invalid json", () => {
    expect(formatJson("{bad").ok).toBe(false);
  });
});

describe("minifyJson", () => {
  it("removes whitespace", () => {
    const result = minifyJson('{ "a" : 1 }');
    expect(result.output).toBe('{"a":1}');
  });
});
