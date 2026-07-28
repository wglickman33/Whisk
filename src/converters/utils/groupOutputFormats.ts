import type { FormatCategory } from "../core/types";
import { formatsByCategory, CATEGORY_LABELS } from "./fileUtils";

const CATEGORY_ORDER: FormatCategory[] = [
  "image",
  "audio",
  "video",
  "document",
  "data",
];

export { CATEGORY_ORDER, CATEGORY_LABELS };

export function groupOutputsByCategory(
  extensions: string[]
): Partial<Record<FormatCategory, string[]>> {
  const catalog = formatsByCategory();
  const grouped: Partial<Record<FormatCategory, string[]>> = {};
  for (const cat of CATEGORY_ORDER) {
    const matches = catalog[cat]
      .map((f) => f.extension)
      .filter((ext) => extensions.includes(ext));
    if (matches.length) grouped[cat] = matches;
  }
  return grouped;
}
