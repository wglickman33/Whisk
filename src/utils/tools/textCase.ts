export type CaseMode =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab";

export const CASE_MODE_LABELS: Record<CaseMode, string> = {
  upper: "UPPERCASE",
  lower: "lowercase",
  title: "Title Case",
  sentence: "Sentence case",
  camel: "camelCase",
  pascal: "PascalCase",
  snake: "snake_case",
  kebab: "kebab-case",
};

function splitWords(input: string): string[] {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

export function transformCase(input: string, mode: CaseMode): string {
  if (!input) return "";

  switch (mode) {
    case "upper":
      return input.toUpperCase();
    case "lower":
      return input.toLowerCase();
    case "title":
      return input
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    case "sentence":
      return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    case "camel": {
      const words = splitWords(input);
      if (!words.length) return "";
      return words[0] + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    }
    case "pascal": {
      const words = splitWords(input);
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    }
    case "snake": {
      const words = splitWords(input);
      return words.join("_");
    }
    case "kebab": {
      const words = splitWords(input);
      return words.join("-");
    }
    default:
      return input;
  }
}
