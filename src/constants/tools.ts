import type { ComponentType } from "react";
import {
  IconCrop,
  IconResize,
  IconCompress,
  IconRemoveBg,
  IconSharpen,
  IconColorPicker,
  IconQR,
  IconMarkdown,
  IconRotate,
  IconJson,
  IconBase64,
  IconHash,
  IconUuid,
  IconAdjust,
  IconFilters,
  IconPalette,
  IconWatermark,
  IconPdf,
  IconExif,
  IconYaml,
  IconDiff,
  IconCounter,
  IconCase,
  IconCsv,
  IconTimestamp,
  IconScale,
  IconOven,
  IconPan,
  IconTimer,
  IconBarcode,
  IconHtml,
} from "../components/ui/ToolsIcons";

export type ToolCategory = "photos" | "kitchen" | "writing" | "codes" | "data";

export type ToolStatus = "live" | "planned";

export interface ToolDef {
  id: string;
  route: string;
  label: string;
  shortLabel: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  steps: string[];
  status: ToolStatus;
  popular?: boolean;
  icon: ComponentType;
}

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  photos: "Photos & Images",
  kitchen: "Kitchen & Cooking",
  writing: "Text & Writing",
  codes: "QR & Barcodes",
  data: "Everyday Utilities",
};

export const TOOL_CATEGORY_ORDER: ToolCategory[] = [
  "photos",
  "kitchen",
  "writing",
  "codes",
  "data",
];

export const TOOLS: ToolDef[] = [
  {
    id: "crop",
    route: "/tools/crop",
    label: "Crop a Photo",
    shortLabel: "Crop",
    description: "Trim your photo to exactly what you need.",
    category: "photos",
    keywords: ["trim", "cut", "photo", "image", "crop"],
    steps: ["Upload your photo", "Drag to select the area", "Download your cropped photo"],
    status: "live",
    popular: true,
    icon: IconCrop,
  },
  {
    id: "resize",
    route: "/tools/resize",
    label: "Resize a Photo",
    shortLabel: "Resize",
    description: "Change the width and height of your photo.",
    category: "photos",
    keywords: ["scale", "dimensions", "size", "photo", "image"],
    steps: ["Upload your photo", "Set the new size", "Download your resized photo"],
    status: "live",
    icon: IconResize,
  },
  {
    id: "compress",
    route: "/tools/compress",
    label: "Shrink a Photo",
    shortLabel: "Compress",
    description: "Make your photo smaller for email or the web.",
    category: "photos",
    keywords: ["compress", "smaller", "file size", "email", "photo"],
    steps: ["Upload your photo", "Choose quality", "Download your smaller photo"],
    status: "live",
    popular: true,
    icon: IconCompress,
  },
  {
    id: "remove-bg",
    route: "/tools/remove-bg",
    label: "Remove Background",
    shortLabel: "Remove BG",
    description: "Erase the background from a photo.",
    category: "photos",
    keywords: ["background", "transparent", "cutout", "photo"],
    steps: ["Upload your photo", "Wait while we remove the background", "Download your result"],
    status: "live",
    icon: IconRemoveBg,
  },
  {
    id: "sharpen",
    route: "/tools/sharpen",
    label: "Sharpen a Photo",
    shortLabel: "Sharpen",
    description: "Make a blurry photo look crisper.",
    category: "photos",
    keywords: ["sharp", "clear", "focus", "photo", "blur"],
    steps: ["Upload your photo", "Adjust sharpness", "Download your sharpened photo"],
    status: "live",
    icon: IconSharpen,
  },
  {
    id: "color-picker",
    route: "/tools/color-picker",
    label: "Pick a Color",
    shortLabel: "Color Picker",
    description: "Click any spot on a photo to get its color.",
    category: "photos",
    keywords: ["color", "hex", "rgb", "palette", "photo"],
    steps: ["Upload your photo", "Click a spot on the image", "Copy the color code"],
    status: "live",
    icon: IconColorPicker,
  },
  {
    id: "rotate",
    route: "/tools/rotate",
    label: "Rotate or Flip a Photo",
    shortLabel: "Rotate",
    description: "Turn your photo or mirror it horizontally or vertically.",
    category: "photos",
    keywords: ["rotate", "flip", "turn", "mirror", "orientation", "photo"],
    steps: ["Upload your photo", "Choose rotate or flip", "Download your result"],
    status: "live",
    icon: IconRotate,
  },
  {
    id: "adjust",
    route: "/tools/adjust",
    label: "Adjust a Photo",
    shortLabel: "Adjust",
    description: "Change brightness, contrast, and color saturation.",
    category: "photos",
    keywords: ["brightness", "contrast", "saturation", "light", "color"],
    steps: ["Upload your photo", "Move the sliders", "Download your adjusted photo"],
    status: "live",
    icon: IconAdjust,
  },
  {
    id: "filters",
    route: "/tools/filters",
    label: "Photo Filters",
    shortLabel: "Filters",
    description: "Apply black & white or sepia looks to your photo.",
    category: "photos",
    keywords: ["filter", "grayscale", "sepia", "black and white", "vintage"],
    steps: ["Upload your photo", "Pick a filter", "Download your result"],
    status: "live",
    icon: IconFilters,
  },
  {
    id: "palette",
    route: "/tools/palette",
    label: "Extract Colors",
    shortLabel: "Palette",
    description: "Pull the main colors from any photo.",
    category: "photos",
    keywords: ["palette", "colors", "swatch", "hex", "design"],
    steps: ["Upload your photo", "See the main colors", "Tap to copy a color code"],
    status: "live",
    icon: IconPalette,
  },
  {
    id: "watermark",
    route: "/tools/watermark",
    label: "Add a Watermark",
    shortLabel: "Watermark",
    description: "Place your name or text on a photo.",
    category: "photos",
    keywords: ["watermark", "text", "overlay", "copyright", "brand"],
    steps: ["Upload your photo", "Enter your watermark text", "Download your photo"],
    status: "live",
    icon: IconWatermark,
  },
  {
    id: "images-to-pdf",
    route: "/tools/images-to-pdf",
    label: "Photos to PDF",
    shortLabel: "To PDF",
    description: "Combine multiple photos into one PDF file.",
    category: "photos",
    keywords: ["pdf", "photos", "combine", "document", "pages"],
    steps: ["Add your photos", "Arrange the order", "Download your PDF"],
    status: "live",
    icon: IconPdf,
  },
  {
    id: "exif",
    route: "/tools/exif",
    label: "Photo Info & Privacy",
    shortLabel: "EXIF",
    description: "View camera details and remove hidden metadata.",
    category: "photos",
    keywords: ["exif", "metadata", "privacy", "camera", "location", "gps"],
    steps: ["Upload your photo", "Review the info", "Download a clean copy"],
    status: "live",
    icon: IconExif,
  },
  {
    id: "qr",
    route: "/tools/qr",
    label: "Make a QR Code",
    shortLabel: "QR Code",
    description: "Create scannable codes for links, Wi-Fi, email, and more.",
    category: "codes",
    keywords: ["qr", "code", "scan", "link", "url", "wifi", "email"],
    steps: ["Pick a type (link, Wi-Fi, etc.)", "Fill in the details", "Download your QR code"],
    status: "live",
    popular: true,
    icon: IconQR,
  },
  {
    id: "barcode",
    route: "/tools/barcode",
    label: "Make a Barcode",
    shortLabel: "Barcode",
    description: "Generate product barcodes like Code 128, EAN-13, and UPC.",
    category: "codes",
    keywords: ["barcode", "upc", "ean", "code128", "scan", "product"],
    steps: ["Choose a barcode type", "Enter the value", "Download your barcode"],
    status: "live",
    icon: IconBarcode,
  },
  {
    id: "markdown",
    route: "/tools/markdown",
    label: "Preview Markdown",
    shortLabel: "Markdown",
    description: "See how formatted text will look before publishing.",
    category: "writing",
    keywords: ["markdown", "preview", "format", "text", "write"],
    steps: ["Type or paste your text", "Check the preview", "Copy or use your formatted text"],
    status: "live",
    icon: IconMarkdown,
  },
  {
    id: "html-preview",
    route: "/tools/html-preview",
    label: "Preview HTML",
    shortLabel: "HTML",
    description: "See how HTML will look — unsafe scripts are removed.",
    category: "writing",
    keywords: ["html", "preview", "web", "markup", "template"],
    steps: ["Paste your HTML", "Check the live preview", "Copy or use your markup"],
    status: "live",
    icon: IconHtml,
  },
  {
    id: "counter",
    route: "/tools/counter",
    label: "Count Words & Characters",
    shortLabel: "Counter",
    description: "See word, character, line, and paragraph counts instantly.",
    category: "writing",
    keywords: ["word count", "character count", "lines", "text", "writing"],
    steps: ["Paste or type your text", "See live counts", "Use the stats for your draft"],
    status: "live",
    icon: IconCounter,
  },
  {
    id: "case",
    route: "/tools/case",
    label: "Change Text Case",
    shortLabel: "Case",
    description: "Switch between uppercase, title case, camelCase, and more.",
    category: "writing",
    keywords: ["uppercase", "lowercase", "title case", "camelCase", "snake_case"],
    steps: ["Enter your text", "Pick a case style", "Copy the result"],
    status: "live",
    icon: IconCase,
  },
  {
    id: "diff",
    route: "/tools/diff",
    label: "Compare Text",
    shortLabel: "Diff",
    description: "See what changed between two versions of text.",
    category: "writing",
    keywords: ["diff", "compare", "changes", "text", "revision"],
    steps: ["Paste the original text", "Paste the revised text", "Review added and removed lines"],
    status: "live",
    icon: IconDiff,
  },
  {
    id: "json",
    route: "/tools/json",
    label: "Format JSON",
    shortLabel: "JSON",
    description: "Make JSON readable or compact, and catch syntax errors.",
    category: "data",
    keywords: ["json", "format", "pretty", "minify", "validate"],
    steps: ["Paste your JSON", "Choose readable or compact", "Copy the result"],
    status: "live",
    popular: true,
    icon: IconJson,
  },
  {
    id: "base64",
    route: "/tools/base64",
    label: "Base64 Encode & Decode",
    shortLabel: "Base64",
    description: "Turn text or small files into Base64, or decode it back.",
    category: "data",
    keywords: ["base64", "encode", "decode", "text", "file"],
    steps: ["Choose encode or decode", "Enter text or pick a file", "Copy the result"],
    status: "live",
    icon: IconBase64,
  },
  {
    id: "hash",
    route: "/tools/hash",
    label: "Hash Generator",
    shortLabel: "Hash",
    description: "Create a SHA-256 or SHA-512 fingerprint of text or a file.",
    category: "data",
    keywords: ["hash", "sha256", "sha512", "checksum", "fingerprint"],
    steps: ["Enter text or choose a file", "Pick an algorithm", "Copy the hash"],
    status: "live",
    icon: IconHash,
  },
  {
    id: "uuid",
    route: "/tools/uuid",
    label: "Generate Unique IDs",
    shortLabel: "UUID",
    description: "Create random unique IDs for apps, tests, or projects.",
    category: "data",
    keywords: ["uuid", "guid", "unique", "id", "random"],
    steps: ["Choose how many IDs", "Click generate", "Copy your IDs"],
    status: "live",
    icon: IconUuid,
  },
  {
    id: "yaml",
    route: "/tools/yaml",
    label: "YAML ↔ JSON",
    shortLabel: "YAML",
    description: "Convert between YAML and JSON formats.",
    category: "data",
    keywords: ["yaml", "json", "convert", "config", "data"],
    steps: ["Paste YAML or JSON", "Choose conversion direction", "Copy the result"],
    status: "live",
    icon: IconYaml,
  },
  {
    id: "csv",
    route: "/tools/csv",
    label: "CSV Tools",
    shortLabel: "CSV",
    description: "Validate CSV, convert to JSON, or preview columns.",
    category: "data",
    keywords: ["csv", "json", "spreadsheet", "table", "data"],
    steps: ["Paste CSV or JSON", "Pick an action", "Copy the result"],
    status: "live",
    icon: IconCsv,
  },
  {
    id: "timestamp",
    route: "/tools/timestamp",
    label: "Unix Timestamp Converter",
    shortLabel: "Timestamp",
    description: "Convert Unix timestamps to readable dates and back.",
    category: "data",
    keywords: ["unix", "timestamp", "epoch", "date", "time"],
    steps: ["Enter a timestamp or date", "See the conversion", "Copy the result"],
    status: "live",
    icon: IconTimestamp,
  },
  {
    id: "ingredient-scale",
    route: "/tools/ingredient-scale",
    label: "Scale a Recipe",
    shortLabel: "Scaler",
    description: "Adjust ingredient amounts for more or fewer servings.",
    category: "kitchen",
    keywords: ["scale", "servings", "ingredients", "recipe", "double", "half"],
    steps: ["Paste your ingredient list", "Set original and target servings", "Copy the scaled amounts"],
    status: "live",
    popular: true,
    icon: IconScale,
  },
  {
    id: "oven-temp",
    route: "/tools/oven-temp",
    label: "Oven Temperature",
    shortLabel: "Oven",
    description: "Convert between Fahrenheit, Celsius, gas mark, and fan oven.",
    category: "kitchen",
    keywords: ["oven", "temperature", "fahrenheit", "celsius", "gas mark", "baking"],
    steps: ["Enter your oven temperature", "Pick Fahrenheit or Celsius", "Use the converted values"],
    status: "live",
    icon: IconOven,
  },
  {
    id: "pan-yield",
    route: "/tools/pan-yield",
    label: "Pan Size Converter",
    shortLabel: "Pan Size",
    description: "See how to scale a recipe when using a different pan.",
    category: "kitchen",
    keywords: ["pan", "baking dish", "scale", "9x13", "round", "square"],
    steps: ["Pick the recipe's pan size", "Pick your pan size", "Scale ingredients and adjust bake time"],
    status: "live",
    icon: IconPan,
  },
  {
    id: "timer",
    route: "/tools/timer",
    label: "Cooking Timer",
    shortLabel: "Timer",
    description: "Set a countdown for baking, simmering, or resting.",
    category: "kitchen",
    keywords: ["timer", "countdown", "cooking", "baking", "kitchen"],
    steps: ["Set minutes and seconds", "Start the timer", "Get alerted when time is up"],
    status: "live",
    icon: IconTimer,
  },
];

export function getLiveTools(): ToolDef[] {
  return TOOLS.filter((t) => t.status === "live");
}

export function getToolById(id: string): ToolDef | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function getToolByRoute(route: string): ToolDef | undefined {
  return TOOLS.find((t) => t.route === route);
}

export function getPopularTools(): ToolDef[] {
  return getLiveTools().filter((t) => t.popular);
}

export function getToolsByCategory(category: ToolCategory): ToolDef[] {
  return getLiveTools().filter((t) => t.category === category);
}

export function getRelatedTools(toolId: string, limit = 3): ToolDef[] {
  const tool = getToolById(toolId);
  if (!tool) return [];
  return getLiveTools()
    .filter((t) => t.id !== toolId && t.category === tool.category)
    .slice(0, limit);
}

export function searchTools(query: string): ToolDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return getLiveTools();
  return getLiveTools().filter((t) => {
    const haystack = [
      t.label,
      t.shortLabel,
      t.description,
      TOOL_CATEGORY_LABELS[t.category],
      ...t.keywords,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getCategoriesWithTools(): ToolCategory[] {
  return TOOL_CATEGORY_ORDER.filter((cat) => getToolsByCategory(cat).length > 0);
}
