import {
  CATEGORY_LABELS,
  FORMAT_CATALOG,
  formatsByCategory,
} from "../converters/utils/fileUtils";
import type { FormatCategory } from "../converters/core/types";

export const TOOL_CAPABILITIES = [
  "Resize, crop, rotate & adjust photos",
  "Filters, palette & watermark",
  "Photos to PDF & EXIF privacy",
  "Compress, sharpen & remove background",
  "Color picker, QR & barcodes",
  "Recipe scaler, oven temp, pan & timer",
  "Word count, case, diff & HTML preview",
  "Markdown, JSON, YAML, CSV & timestamps",
  "Base64, hash & UUID generators",
] as const;

export const APP_CAPABILITIES = [
  "Unit converter (volume, weight, length, area, time, and more)",
  "Recipes with folders, tags, scaling, and URL import",
  "Recipe export: Whisk JSON, PDF, and plain text",
  "Shared shopping lists with share codes and live updates",
  "Shopping list categories and recipe ingredient import",
  "Settings: light, dark, or auto theme; synced preferences",
] as const;

export const UNSUPPORTED_ITEMS = [
  "PowerPoint (PPT/PPTX)",
  "OpenDocument (ODT)",
  "EPUB / Kindle",
  "Legacy Word (.doc)",
  "RAW camera files",
  "Photoshop PSD (layers)",
  "Password-protected files",
  "ZIP / RAR archives",
  "DRM-protected media",
] as const;

export const IMPOSSIBLE_EXAMPLES = [
  "PNG → MP4",
  "JPG → video",
  "Audio → video with picture",
] as const;

export const CAPABILITIES_COPY = {
  pageTitle: "What Whisk Can Do",
  pageSubtitle: "Quick reference. No fine print.",
  supportedTitle: "Supported",
  supportedNote: "Runs on your device. Files are not uploaded for conversion.",
  toolsTitle: "Image tools",
  appTitle: "Also in Whisk",
  unsupportedTitle: "Not available here",
  unsupportedNote:
    "These need desktop software or paid servers. Whisk stays free and private instead.",
  impossibleTitle: "Won't convert",
  impossibleNote: "Some combinations don't make sense, so we won't offer them.",
  freeTagline: "Free · No ads · No paywalls",
} as const;

const CATEGORY_ORDER: FormatCategory[] = [
  "image",
  "audio",
  "video",
  "document",
  "data",
];

export interface FormatGroup {
  id: string;
  label: string;
  items: string[];
}

/** Unique format labels grouped by catalog category for the capabilities page. */
export function getSupportedFormatGroups(): FormatGroup[] {
  const byCategory = formatsByCategory();

  return CATEGORY_ORDER.map((cat) => {
    const labels = [
      ...new Set(byCategory[cat].map((def) => def.label)),
    ].sort();
    return {
      id: cat,
      label: CATEGORY_LABELS[cat],
      items: labels,
    };
  }).filter((group) => group.items.length > 0);
}

/** All unique input extensions users can drop in the file converter. */
export function getAllInputExtensions(): string[] {
  const exts = new Set<string>();
  for (const def of Object.values(FORMAT_CATALOG)) {
    exts.add(def.extension.toUpperCase());
  }
  return [...exts].sort();
}
