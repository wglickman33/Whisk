import { describe, it, expect } from "vitest";
import * as ToolsPages from "./index";

const TOOL_PAGE_NAMES = [
  "AdjustPage",
  "CropPage",
  "ResizePage",
  "CompressPage",
  "RemoveBgPage",
  "SharpenPage",
  "ColorPickerPage",
  "RotatePage",
  "FiltersPage",
  "PalettePage",
  "WatermarkPage",
  "ImagesToPdfPage",
  "ExifPage",
  "IngredientScalePage",
  "OvenTempPage",
  "PanYieldPage",
  "TimerPage",
  "MarkdownPage",
  "HtmlPreviewPage",
  "CounterPage",
  "CasePage",
  "DiffPage",
  "QRGeneratorPage",
  "BarcodePage",
  "JsonPage",
  "Base64Page",
  "HashPage",
  "UuidPage",
  "YamlPage",
  "CsvPage",
  "TimestampPage",
] as const;

describe("tools pages barrel", () => {
  it("exports layout and home", () => {
    expect(ToolsPages.ToolsLayout).toBeTruthy();
    expect(ToolsPages.ToolsHomePage).toBeTruthy();
  });

  it("exports every tool page", () => {
    for (const name of TOOL_PAGE_NAMES) {
      expect(ToolsPages[name as keyof typeof ToolsPages]).toBeTruthy();
    }
    expect(TOOL_PAGE_NAMES.length).toBe(31);
  });
});
