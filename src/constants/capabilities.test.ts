import { describe, it, expect } from "vitest";
import {
  getSupportedFormatGroups,
  getAllInputExtensions,
  UNSUPPORTED_ITEMS,
} from "./capabilities";

describe("capabilities constants", () => {
  it("returns format groups with items", () => {
    const groups = getSupportedFormatGroups();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
  });

  it("includes image formats", () => {
    const images = getSupportedFormatGroups().find((g) => g.id === "image");
    expect(images?.items).toContain("PNG");
  });

  it("lists uppercase input extensions from catalog", () => {
    const extensions = getAllInputExtensions();
    expect(extensions.every((ext) => ext === ext.toUpperCase())).toBe(true);
    expect(extensions.length).toBeGreaterThan(10);
  });

  it("documents known unsupported formats", () => {
    expect(UNSUPPORTED_ITEMS).toContain("PowerPoint (PPT/PPTX)");
    expect(UNSUPPORTED_ITEMS).toContain("Password-protected files");
  });
});
