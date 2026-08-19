import { GROQ_CHAT_URL, parseGroqChatPayload } from "./groqChat.js";
import { LIMITS, sanitizeString } from "./validation.js";

export const GROQ_VISION_MODEL = "qwen/qwen3.6-27b";
export const RECIPE_IMAGE_MAX_BYTES = 1_500_000;
export const RECIPE_IMAGE_MAX_COUNT = 5;
export const RECIPE_IMAGE_MAX_TOTAL_BYTES = 5_000_000;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i;

export type ParsedRecipeDraft = {
  title: string;
  description: string | null;
  servings: number;
  servingUnit: string;
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
  "If it is a recipe, use {\"isRecipe\":true,\"title\":\"\",\"description\":null,\"servings\":4,\"servingUnit\":\"servings\"," +
  "\"prepTime\":null,\"cookTime\":null,\"ingredients\":[{\"name\":\"\",\"quantity\":1,\"unit\":\"\",\"notes\":null,\"isOptional\":false}]," +
  "\"steps\":[{\"instruction\":\"\",\"timerMinutes\":null}]}. " +
  "Copy quantities from the photos. Do not invent ingredients or steps that are not visible. " +
  "If a field is missing, use null or a sensible default for servings.";

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
      return { error: "Those photos are too large together. Try fewer or closer crops." };
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
  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseVisionRecipeJson(text: string): RecipeImageParseResult {
  const rec = parseJsonObject(text);
  if (!rec) {
    return { ok: false, status: 502, error: "Could not read a recipe in those photos. Try again." };
  }
  if (rec.isRecipe === false) {
    return {
      ok: false,
      status: 422,
      error: "Those photos do not look like a recipe. Try cookbook pages, a card, or screenshots.",
    };
  }

  const title = sanitizeString(rec.title, LIMITS.titleMax);
  if (!title) {
    return { ok: false, status: 422, error: "Could not find a recipe title in those photos." };
  }

  const ingredientsRaw = Array.isArray(rec.ingredients) ? rec.ingredients : [];
  const stepsRaw = Array.isArray(rec.steps) ? rec.steps : [];
  const ingredients = ingredientsRaw
    .slice(0, LIMITS.maxIngredients)
    .map((item) => {
      if (typeof item === "string") {
        const name = sanitizeString(item, LIMITS.ingredientNameMax);
        return name
          ? { name, quantity: 0, unit: "", notes: null, isOptional: false }
          : null;
      }
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = sanitizeString(row.name, LIMITS.ingredientNameMax);
      if (!name) return null;
      return {
        name,
        quantity: parseQuantity(row.quantity),
        unit: sanitizeString(row.unit, 50) ?? "",
        notes: sanitizeString(row.notes, 200),
        isOptional: row.isOptional === true,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const steps = stepsRaw
    .slice(0, LIMITS.maxSteps)
    .map((item) => {
      if (typeof item === "string") {
        const instruction = sanitizeString(item, LIMITS.instructionMax);
        return instruction ? { instruction, timerMinutes: null } : null;
      }
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const instruction = sanitizeString(row.instruction, LIMITS.instructionMax);
      if (!instruction) return null;
      const mins = typeof row.timerMinutes === "number" ? row.timerMinutes : null;
      return {
        instruction,
        timerMinutes: mins != null && Number.isFinite(mins) && mins > 0 ? mins : null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (ingredients.length === 0 && steps.length === 0) {
    return {
      ok: false,
      status: 422,
      error: "Could not find ingredients or steps in those photos.",
    };
  }

  const servingsRaw = typeof rec.servings === "number" ? rec.servings : Number(rec.servings);
  const servings =
    Number.isFinite(servingsRaw) && servingsRaw > 0 && servingsRaw <= 1000 ? servingsRaw : 4;

  const times: string[] = [];
  if (typeof rec.prepTime === "number" && rec.prepTime > 0) times.push(`Prep ${rec.prepTime} min`);
  if (typeof rec.cookTime === "number" && rec.cookTime > 0) times.push(`Cook ${rec.cookTime} min`);
  const descriptionBits = [sanitizeString(rec.description, LIMITS.descriptionMax), times.join(". ")].filter(
    Boolean
  );

  return {
    ok: true,
    recipe: {
      title,
      description: descriptionBits.length ? descriptionBits.join(" · ").slice(0, LIMITS.descriptionMax) : null,
      servings,
      servingUnit: sanitizeString(rec.servingUnit, 40) || "servings",
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

    if (response.status === 429) {
      return {
        ok: false,
        status: 429,
        error: "Photo import is busy right now. Try again in a moment.",
      };
    }
    if (!response.ok) {
      let groqCode = "";
      try {
        const errBody = (await response.json()) as { error?: { message?: unknown; code?: unknown } };
        const message = typeof errBody.error?.message === "string" ? errBody.error.message : "";
        const code = typeof errBody.error?.code === "string" ? errBody.error.code : "";
        groqCode = [String(response.status), code, message.slice(0, 180)].filter(Boolean).join(" ");
      } catch {
        groqCode = String(response.status);
      }
      console.error("Photo import Groq error:", groqCode);
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
