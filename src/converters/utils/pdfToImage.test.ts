import { describe, it, expect } from "vitest";
import {
  getPdfPageLimit,
  scaleToMaxSide,
  PDF_IMAGE_MAX_PAGES,
  PDF_IMAGE_MAX_SIDE_PX,
  wrapPdfTextAsHtml,
} from "./pdfToImage";

describe("getPdfPageLimit", () => {
  it("caps at max pages", () => {
    expect(getPdfPageLimit(100)).toEqual({
      pagesToRender: PDF_IMAGE_MAX_PAGES,
      wasCapped: true,
    });
  });

  it("allows small pdfs through", () => {
    expect(getPdfPageLimit(3)).toEqual({ pagesToRender: 3, wasCapped: false });
  });

  it("rejects zero pages", () => {
    expect(() => getPdfPageLimit(0)).toThrow(/no pages/i);
  });
});

describe("scaleToMaxSide", () => {
  it("downscales large dimensions", () => {
    const result = scaleToMaxSide(8000, 6000, PDF_IMAGE_MAX_SIDE_PX);
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(PDF_IMAGE_MAX_SIDE_PX);
  });

  it("keeps small dimensions unchanged", () => {
    const result = scaleToMaxSide(800, 600, PDF_IMAGE_MAX_SIDE_PX);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.scale).toBe(1);
  });
});

describe("wrapPdfTextAsHtml", () => {
  it("escapes html in body text", () => {
    const html = wrapPdfTextAsHtml("<script>", "Title");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("escapes html in title", () => {
    const html = wrapPdfTextAsHtml("body", 'Evil"><script>');
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toMatch(/<h1>Evil"><script>/);
  });
});
