import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SafeMarkdown } from "./SafeMarkdown";

describe("SafeMarkdown", () => {
  it("renders bold text", () => {
    render(<SafeMarkdown>**hello**</SafeMarkdown>);
    expect(screen.getByText("hello").tagName).toBe("STRONG");
  });

  it("does not render raw html tags", () => {
    const { container } = render(<SafeMarkdown>{"<script>alert(1)</script>"}</SafeMarkdown>);
    expect(container.querySelector("script")).toBeNull();
  });

  it("adds rel noopener on external links", () => {
    render(<SafeMarkdown>[link](https://example.com)</SafeMarkdown>);
    const link = screen.getByRole("link", { name: "link" });
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("wraps markdown tables so they can scroll instead of overflowing", () => {
    const { container } = render(
      <SafeMarkdown>{`| Ingredient | Quantity |\n| --- | --- |\n| Salmon | 1.5 lb |`}</SafeMarkdown>
    );
    const wrap = container.querySelector(".md-table-wrap");
    expect(wrap).toBeTruthy();
    expect(wrap?.querySelector("table")).toBeTruthy();
    expect(screen.getByText("Salmon")).toBeTruthy();
    expect(screen.getByText("1.5 lb")).toBeTruthy();
  });
});
