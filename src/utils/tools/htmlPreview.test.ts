import { describe, it, expect } from "vitest";
import { sanitizeHtmlPreview } from "./htmlPreview";

describe("sanitizeHtmlPreview", () => {
  it("sanitizes safe html", () => {
    const result = sanitizeHtmlPreview("<h1>Hello</h1><p>World</p>");
    expect(result.ok).toBe(true);
    expect(result.html).toContain("<h1>");
    expect(result.html).toContain("World");
  });

  it("strips script tags", () => {
    const result = sanitizeHtmlPreview("<p>Hi</p><script>alert(1)</script>");
    expect(result.ok).toBe(true);
    expect(result.html).toContain("Hi");
    expect(result.html).not.toMatch(/<script/i);
    expect(result.stripped).toBe(true);
  });

  it("rejects empty input", () => {
    expect(sanitizeHtmlPreview("").ok).toBe(false);
  });
});
