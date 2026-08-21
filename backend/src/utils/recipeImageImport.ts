import { GROQ_CHAT_URL, parseGroqChatPayload } from "./groqChat.js";
import {
  GROQ_VISION_MAX_COMPLETION_TOKENS,
  RECIPE_IMAGE_MAX_BYTES,
  RECIPE_IMAGE_MAX_COUNT,
  RECIPE_IMAGE_MAX_TOTAL_BYTES,
} from "../constants/recipePhotoImport.js";
import { LIMITS, sanitizeString } from "./validation.js";

export const GROQ_VISION_MODEL = "qwen/qwen3.6-27b";
export { RECIPE_IMAGE_MAX_COUNT } from "../constants/recipePhotoImport.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i;

export type ParsedRecipeDraft = {
  title: string;
  description: string | null;
  servings: number;
  servingUnit: string;
  tagLabels: string[];
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    notes: string | null;
    isOptional: boolean;
  }[];
  steps: { instruction: string; timerMinutes: number | null }[];
};

export type RecipeImageParseResult =
  | { ok: true; recipe: ParsedRecipeDraft }
  | { ok: false; status: number; error: string };

const RECIPE_IMAGE_PROMPT =
  "Read the recipe in these photos. They are pages of the same recipe, in order from first to last. " +
  "Combine them into one recipe. Merge overlapping lines. Reply with JSON only. " +
  "If none of the photos is a recipe, use {\"isRecipe\":false}. " +
  "If it is a recipe, fill every required field. Never omit title, description, tags, ingredients, or steps. " +
  "Never use empty strings or empty arrays for those fields. " +
  "Required JSON: {\"isRecipe\":true,\"title\":\"Dish name\",\"description\":\"One short sentence.\",\"servings\":4,\"servingUnit\":\"Servings\"," +
  "\"prepTime\":null,\"cookTime\":null,\"tags\":[\"Savory\",\"Dinner\"]," +
  "\"ingredients\":[{\"name\":\"flour\",\"quantity\":2,\"unit\":\"cups\",\"notes\":null,\"isOptional\":false}]," +
  "\"steps\":[{\"instruction\":\"Mix until smooth.\",\"timerMinutes\":null}]}. " +
  "title: the dish name. If the photos have no name, name it from the main ingredients. " +
  "description: always one short sentence from what is visible (what it is, flavor, or method). " +
  "tags: always 2 to 4 short labels. Prefer Savory, Sweet, Spicy, Vegetarian, Fish, Chicken, Beef, Dessert, or Dinner. " +
  "ingredients: every ingredient from every page, including sauces, marinades, toppings, and garnishes. Do not stop after the first item. " +
  "steps: every direction from every page, in order. Do not stop after the first step. " +
  "Copy quantities from the photos. Do not invent ingredients or steps that are not visible. " +
  "servings may default to 4 if missing. servingUnit must be Servings unless the photos say otherwise.";

const INGREDIENT_KEYS = [
  "ingredients",
  "ingredientList",
  "ingredient_list",
  "sauce",
  "sauceIngredients",
  "stickySauce",
  "marinade",
  "rub",
  "topping",
  "toppings",
  "filling",
  "garnish",
  "dressing",
];

const STEP_KEYS = [
  "steps",
  "directions",
  "instructions",
  "method",
  "procedure",
  "howTo",
  "how_to",
  "preparation",
];

const TAG_HINTS: { label: string; test: RegExp }[] = [
  { label: "Chicken", test: /\bchickens?\b|\bschnitzel\b|\bcutlets?\b/i },
  { label: "Beef", test: /\bbeef\b|\bsteak\b|\bbrisket\b/i },
  { label: "Fish", test: /\bfish\b|\bsalmon\b|\btuna\b|\bcod\b|\bshrimp\b|\bprawns?\b|\bseafood\b/i },
  { label: "Vegetarian", test: /\bvegetarian\b|\bvegan\b|\btofu\b|\blentils?\b|\bchickpeas?\b/i },
  { label: "Dessert", test: /\bdessert\b|\bcake\b|\bcookies?\b|\bbrownies?\b|\bpancakes?\b|\bwaffles?\b|\bice cream\b/i },
  { label: "Spicy", test: /\bspicy\b|\bchili\b|\bchilli\b|\bsriracha\b|\bcayenne\b|\bjalape/i },
  { label: "Sweet", test: /\bsweet\b|\bhoney\b|\bchocolate\b|\bmaple\b|\bsugar\b/i },
  { label: "Dinner", test: /\bdinner\b|\broast\b|\bbake\b|\bsupper\b/i },
  { label: "Savory", test: /\bsavory\b|\bsavoury\b|\bgarlic\b|\bonion\b|\bsalt\b/i },
];

function looksLikeJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function looksLikePng(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

function looksLikeGif(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  );
}

function looksLikeWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const riff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const webp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return riff && webp;
}

function mimeMatchesBytes(mime: string, bytes: Uint8Array): boolean {
  if (mime === "image/jpeg") return looksLikeJpeg(bytes);
  if (mime === "image/png") return looksLikePng(bytes);
  if (mime === "image/gif") return looksLikeGif(bytes);
  if (mime === "image/webp") return looksLikeWebp(bytes);
  return false;
}

function parseOneImage(raw: unknown): { error: string } | { mime: string; dataUrl: string; bytes: number } {
  if (typeof raw !== "string" || !raw.trim()) {
    return { error: "A recipe photo is required." };
  }
  const match = raw.trim().match(DATA_URL_RE);
  if (!match) {
    return { error: "Use JPEG, PNG, WebP, or GIF photos." };
  }
  const mime = match[1].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return { error: "Use JPEG, PNG, WebP, or GIF photos." };
  }
  let bytes: Buffer;
  try {
    bytes = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  } catch {
    return { error: "That photo could not be read." };
  }
  if (!bytes.length) return { error: "That photo could not be read." };
  if (bytes.length > RECIPE_IMAGE_MAX_BYTES) {
    return { error: "That photo is too large. Try a closer crop." };
  }
  if (!mimeMatchesBytes(mime, bytes)) {
    return { error: "That file does not look like a photo." };
  }
  return { mime, dataUrl: `data:${mime};base64,${bytes.toString("base64")}`, bytes: bytes.length };
}

export function parseRecipeImageBody(
  body: Record<string, unknown>
): { error: string } | { dataUrls: string[] } {
  const rawList = Array.isArray(body.images)
    ? body.images
    : typeof body.image === "string"
      ? [body.image]
      : [];
  if (rawList.length === 0) return { error: "A recipe photo is required." };
  if (rawList.length > RECIPE_IMAGE_MAX_COUNT) {
    return { error: `Use up to ${RECIPE_IMAGE_MAX_COUNT} photos for one recipe.` };
  }

  const dataUrls: string[] = [];
  let totalBytes = 0;
  for (const raw of rawList) {
    const parsed = parseOneImage(raw);
    if ("error" in parsed) return parsed;
    totalBytes += parsed.bytes;
    if (totalBytes > RECIPE_IMAGE_MAX_TOTAL_BYTES) {
      return { error: "Those pages are too large together. Try one page or tighter crops." };
    }
    dataUrls.push(parsed.dataUrl);
  }
  return { dataUrls };
}

function parseQuantity(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.round(value * 100) / 100;
  }
  if (typeof value !== "string") return 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (trimmed.includes("/")) {
    const [num, den] = trimmed.split("/").map(Number);
    if (den) return Math.round((num / den) * 100) / 100;
  }
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const attempts = [candidate];
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) attempts.push(candidate.slice(start, end + 1));
  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      /* try the next shape */
    }
  }
  return null;
}

function optionalText(value: unknown, maxLen: number): string | null {
  const text = sanitizeString(value, maxLen);
  return text ? text : null;
}

function unwrapRecipeRecord(rec: Record<string, unknown>): Record<string, unknown> {
  const nested = rec.recipe;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...rec, ...(nested as Record<string, unknown>) };
  }
  return rec;
}

function splitListText(text: string): string[] {
  const lines = text
    .split(/\r?\n+|•/g)
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : [];
}

function valuesAsList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return splitListText(value);
  if (value && typeof value === "object") {
    const nested: unknown[] = [];
    for (const child of Object.values(value as Record<string, unknown>)) {
      if (Array.isArray(child)) nested.push(...child);
      else if (typeof child === "string" && child.trim()) nested.push(...splitListText(child));
    }
    return nested;
  }
  return [];
}

function collectNamedLists(rec: Record<string, unknown>, names: string[]): unknown[] {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  const out: unknown[] = [];
  for (const [key, value] of Object.entries(rec)) {
    if (!wanted.has(key.toLowerCase())) continue;
    out.push(...valuesAsList(value));
  }
  return out;
}

function parseTagLabels(raw: unknown): string[] {
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/[,/|&]+/)
      : [];
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const item of items.slice(0, 6)) {
    const label = optionalText(item, LIMITS.tagLabelMax);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }
  return labels;
}

function inferTagLabels(text: string): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const hint of TAG_HINTS) {
    if (!hint.test.test(text)) continue;
    const key = hint.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(hint.label);
    if (labels.length >= 4) break;
  }
  if (!seen.has("savory") && !seen.has("sweet") && !seen.has("dessert")) {
    labels.push("Savory");
  }
  return labels.slice(0, 4);
}

function completeTagLabels(parsed: string[], text: string): string[] {
  const labels = [...parsed];
  const seen = new Set(labels.map((label) => label.toLowerCase()));
  if (labels.length >= 2) return labels.slice(0, 4);
  for (const extra of inferTagLabels(text)) {
    const key = extra.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(extra);
    if (labels.length >= 2) break;
  }
  if (labels.length === 0) labels.push("Savory");
  if (labels.length === 1) {
    const only = labels[0].toLowerCase();
    if (only === "dessert") labels.push("Sweet");
    else if (only === "sweet") labels.push("Dessert");
    else if (only !== "savory") labels.push("Savory");
    else labels.push("Dinner");
  }
  return labels.slice(0, 4);
}

function fallbackDescription(title: string, ingredientNames: string[]): string {
  const names = ingredientNames.filter(Boolean).slice(0, 3);
  if (names.length >= 2) {
    return `${title} with ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}.`;
  }
  if (names.length === 1) return `${title} with ${names[0]}.`;
  return `A recipe for ${title}.`;
}

function ingredientName(row: Record<string, unknown>): string | null {
  return (
    optionalText(row.name, LIMITS.ingredientNameMax) ??
    optionalText(row.ingredient, LIMITS.ingredientNameMax) ??
    optionalText(row.item, LIMITS.ingredientNameMax)
  );
}

function stepInstruction(row: Record<string, unknown>): string | null {
  return (
    optionalText(row.instruction, LIMITS.instructionMax) ??
    optionalText(row.text, LIMITS.instructionMax) ??
    optionalText(row.step, LIMITS.instructionMax) ??
    optionalText(row.direction, LIMITS.instructionMax)
  );
}

function formatServingUnit(value: unknown): string {
  const unit = optionalText(value, 40) || "Servings";
  return unit.toLowerCase() === "servings" ? "Servings" : unit;
}

export function parseVisionRecipeJson(text: string): RecipeImageParseResult {
  const parsed = parseJsonObject(text);
  if (!parsed) {
    return { ok: false, status: 502, error: "Could not read a recipe in those photos. Try again." };
  }
  const rec = unwrapRecipeRecord(parsed);
  if (rec.isRecipe === false) {
    return {
      ok: false,
      status: 422,
      error: "Those photos do not look like a recipe. Try cookbook pages, a card, or screenshots.",
    };
  }

  const ingredientsRaw = collectNamedLists(rec, INGREDIENT_KEYS);
  const stepsRaw = collectNamedLists(rec, STEP_KEYS);
  const ingredients = ingredientsRaw
    .slice(0, LIMITS.maxIngredients)
    .map((item) => {
      if (typeof item === "string") {
        const name = optionalText(item, LIMITS.ingredientNameMax);
        return name
          ? { name, quantity: 0, unit: "", notes: null, isOptional: false }
          : null;
      }
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = ingredientName(row);
      if (!name) return null;
      return {
        name,
        quantity: parseQuantity(row.quantity),
        unit: optionalText(row.unit, 50) ?? "",
        notes: optionalText(row.notes, 200),
        isOptional: row.isOptional === true,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const steps = stepsRaw
    .slice(0, LIMITS.maxSteps)
    .map((item) => {
      if (typeof item === "string") {
        const instruction = optionalText(item, LIMITS.instructionMax);
        return instruction ? { instruction, timerMinutes: null } : null;
      }
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const instruction = stepInstruction(row);
      if (!instruction) return null;
      const mins = typeof row.timerMinutes === "number" ? row.timerMinutes : null;
      return {
        instruction,
        timerMinutes: mins != null && Number.isFinite(mins) && mins > 0 ? mins : null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (ingredients.length === 0 || steps.length === 0) {
    return {
      ok: false,
      status: 422,
      error:
        ingredients.length === 0
          ? "Could not find ingredients in those photos. Try a clearer shot of the list."
          : "Could not find instructions in those photos. Try a clearer shot of the steps.",
    };
  }

  const title =
    optionalText(rec.title, LIMITS.titleMax) ??
    optionalText(rec.name, LIMITS.titleMax) ??
    optionalText(rec.recipeName, LIMITS.titleMax) ??
    optionalText(rec.dish, LIMITS.titleMax) ??
    ingredients[0].name;

  const servingsRaw = typeof rec.servings === "number" ? rec.servings : Number(rec.servings);
  const servings =
    Number.isFinite(servingsRaw) && servingsRaw > 0 && servingsRaw <= 1000 ? servingsRaw : 4;

  const times: string[] = [];
  if (typeof rec.prepTime === "number" && rec.prepTime > 0) times.push(`Prep ${rec.prepTime} min`);
  if (typeof rec.cookTime === "number" && rec.cookTime > 0) times.push(`Cook ${rec.cookTime} min`);
  const written =
    optionalText(rec.description, LIMITS.descriptionMax) ??
    optionalText(rec.summary, LIMITS.descriptionMax);
  const descriptionBits = [
    written ?? fallbackDescription(title, ingredients.map((row) => row.name)),
    times.join(". "),
  ].filter(Boolean);

  const haystack = [title, written ?? "", ...ingredients.map((row) => row.name), ...steps.map((row) => row.instruction)].join(" ");
  const tagLabels = completeTagLabels(
    parseTagLabels(rec.tags ?? rec.tagLabels ?? rec.categories),
    haystack
  );

  return {
    ok: true,
    recipe: {
      title,
      description: descriptionBits.join(" · ").slice(0, LIMITS.descriptionMax),
      servings,
      servingUnit: formatServingUnit(rec.servingUnit),
      tagLabels,
      ingredients,
      steps,
    },
  };
}

export async function readRecipeFromImages(
  dataUrls: string[],
  options: { apiKey: string; fetchFn?: typeof fetch; timeoutMs?: number; model?: string }
): Promise<RecipeImageParseResult> {
  const fetchFn = options.fetchFn ?? fetch;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const imageParts = dataUrls.map((url) => ({
    type: "image_url" as const,
    image_url: { url },
  }));

  try {
    const response = await fetchFn(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model ?? GROQ_VISION_MODEL,
        temperature: 0,
        max_completion_tokens: GROQ_VISION_MAX_COMPLETION_TOKENS,
        reasoning_effort: "none",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: RECIPE_IMAGE_PROMPT }, ...imageParts],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let groqMessage = "";
      let groqCode = "";
      try {
        const errBody = (await response.json()) as { error?: { message?: unknown; code?: unknown } };
        groqMessage = typeof errBody.error?.message === "string" ? errBody.error.message : "";
        groqCode = typeof errBody.error?.code === "string" ? errBody.error.code : "";
        console.error(
          "Photo import Groq error:",
          [String(response.status), groqCode, groqMessage.slice(0, 180)].filter(Boolean).join(" ")
        );
      } catch {
        console.error("Photo import Groq error:", response.status);
      }
      if (response.status === 429 || groqCode === "rate_limit_exceeded") {
        const tooManyTokens = /token/i.test(groqMessage);
        return {
          ok: false,
          status: 429,
          error: tooManyTokens
            ? "Those pages are too much for one read right now. Try one page, tighter crops, or wait a minute."
            : "Photo import is busy right now. Try again in a minute.",
        };
      }
      return { ok: false, status: 502, error: "Could not read those recipe photos. Try again." };
    }

    const data = await response.json();
    const reply = parseGroqChatPayload(data);
    if (!reply) {
      return { ok: false, status: 502, error: "Could not read a recipe in those photos. Try again." };
    }
    return parseVisionRecipeJson(reply);
  } catch (err) {
    const aborted =
      (err instanceof Error && err.name === "AbortError") ||
      (typeof err === "object" && err !== null && "name" in err && (err as { name: string }).name === "AbortError");
    if (aborted) {
      return { ok: false, status: 504, error: "Reading those photos took too long. Try again." };
    }
    return { ok: false, status: 502, error: "Could not read those recipe photos. Try again." };
  } finally {
    clearTimeout(timeout);
  }
}
