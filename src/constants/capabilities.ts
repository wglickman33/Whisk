import {
  CATEGORY_LABELS,
  FORMAT_CATALOG,
  formatsByCategory,
} from "../converters/utils/fileUtils";
import type { FormatCategory } from "../converters/core/types";

export const TOOL_CAPABILITIES = [
  "Resize & crop",
  "Compress & sharpen",
  "Remove background",
  "Color picker & QR codes",
  "Markdown preview",
] as const;

export const APP_CAPABILITIES = [
  "Unit converter",
  "Recipes & scaling",
  "Shopping list",
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
  pageSubtitle: "Quick reference — no fine print.",
  supportedTitle: "Supported",
  supportedNote: "Runs on your device. Files are not uploaded for conversion.",
  toolsTitle: "Image tools",
  appTitle: "Also in Whisk",
  unsupportedTitle: "Not available here",
  unsupportedNote:
    "These need desktop software or paid servers. Whisk stays free and private instead.",
  impossibleTitle: "Won't convert",
  impossibleNote: "Some combinations don't make sense — we won't offer them.",
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
