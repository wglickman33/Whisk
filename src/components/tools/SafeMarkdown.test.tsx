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
});
