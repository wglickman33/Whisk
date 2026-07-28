import { describe, it, expect } from "vitest";
import { getSupportedOutputFormats, getHandlerForConversion } from "./conversionEngine";
import { ALL_FORMAT_EXTENSIONS, normalizeExtension } from "../utils/fileUtils";

describe("canConvert matrix", () => {
  it("allows jpg to png", () => {
    expect(getSupportedOutputFormats("jpg")).toContain("png");
    expect(getHandlerForConversion("jpg", "png")).toBeDefined();
  });

  it("blocks png to mp4", () => {
    expect(getSupportedOutputFormats("png")).not.toContain("mp4");
    expect(getHandlerForConversion("png", "mp4")).toBeUndefined();
  });

  it("allows pdf to txt and png", () => {
    expect(getSupportedOutputFormats("pdf")).toContain("txt");
    expect(getSupportedOutputFormats("pdf")).toContain("png");
    expect(getSupportedOutputFormats("pdf")).toContain("html");
  });

  it("allows csv to pdf", () => {
    expect(getSupportedOutputFormats("csv")).toContain("pdf");
  });

  it("never offers same format as output", () => {
    for (const ext of ALL_FORMAT_EXTENSIONS) {
      const outputs = getSupportedOutputFormats(ext);
      const normalized = normalizeExtension(ext);
      expect(outputs).not.toContain(normalized);
    }
  });

  it("csv has json output", () => {
    expect(getSupportedOutputFormats("csv")).toContain("json");
  });
});
