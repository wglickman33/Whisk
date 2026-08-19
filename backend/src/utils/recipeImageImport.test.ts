import { describe, it, expect, vi } from "vitest";
import {
  parseRecipeImageBody,
  parseVisionRecipeJson,
  readRecipeFromImages,
  GROQ_VISION_MODEL,
  RECIPE_IMAGE_MAX_COUNT,
} from "./recipeImageImport.js";
import { GROQ_CHAT_URL } from "./groqChat.js";

const JPEG_B64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).toString("base64");
const JPEG_DATA = `data:image/jpeg;base64,${JPEG_B64}`;

describe("parseRecipeImageBody", () => {
  it("accepts a jpeg data URL", () => {
    const result = parseRecipeImageBody({ image: JPEG_DATA });
    expect(result).toEqual({ dataUrls: [JPEG_DATA] });
  });

  it("accepts several photos in order", () => {
    const result = parseRecipeImageBody({ images: [JPEG_DATA, JPEG_DATA] });
    expect(result).toEqual({ dataUrls: [JPEG_DATA, JPEG_DATA] });
  });

  it("rejects missing, too many, wrong type, and mismatched bytes", () => {
    expect(parseRecipeImageBody({})).toEqual({ error: "A recipe photo is required." });
    expect(parseRecipeImageBody({ images: Array(RECIPE_IMAGE_MAX_COUNT + 1).fill(JPEG_DATA) })).toEqual({
      error: `Use up to ${RECIPE_IMAGE_MAX_COUNT} photos for one recipe.`,
    });
    expect(parseRecipeImageBody({ image: "not-an-image" })).toEqual({
      error: "Use JPEG, PNG, WebP, or GIF photos.",
    });
    const fakePng = `data:image/png;base64,${JPEG_B64}`;
    expect(parseRecipeImageBody({ image: fakePng })).toEqual({
      error: "That file does not look like a photo.",
    });
  });
});

describe("parseVisionRecipeJson", () => {
  it("maps a recipe payload into a draft", () => {
    const result = parseVisionRecipeJson(
      JSON.stringify({
        isRecipe: true,
        title: "Firecracker Salmon",
        description: "Spicy glaze",
        servings: 4,
        servingUnit: "servings",
        prepTime: 15,
        cookTime: 20,
        ingredients: [
          { name: "Salmon", quantity: 1.5, unit: "lb", notes: null, isOptional: false },
          { name: "Sriracha", quantity: "1/2", unit: "cup" },
        ],
        steps: [{ instruction: "Bake until flaky.", timerMinutes: 18 }],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.title).toBe("Firecracker Salmon");
    expect(result.recipe.description).toContain("Prep 15 min");
    expect(result.recipe.ingredients[1].quantity).toBe(0.5);
    expect(result.recipe.steps[0].timerMinutes).toBe(18);
  });

  it("rejects non-recipes and empty extractions", () => {
    expect(parseVisionRecipeJson('{"isRecipe":false}').ok).toBe(false);
    expect(
      parseVisionRecipeJson(JSON.stringify({ isRecipe: true, title: "Soup", ingredients: [], steps: [] }))
    ).toMatchObject({ status: 422 });
    expect(parseVisionRecipeJson("not json").ok).toBe(false);
  });

  it("reads JSON inside a markdown fence", () => {
    const result = parseVisionRecipeJson(
      '```json\n{"isRecipe":true,"title":"Pancakes","ingredients":["flour"],"steps":["mix"]}\n```'
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.ingredients[0].name).toBe("flour");
    expect(result.recipe.steps[0].instruction).toBe("mix");
  });
});

describe("readRecipeFromImages", () => {
  it("sends every photo to the vision model and returns a draft", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isRecipe: true,
                title: "Pancakes",
                ingredients: [{ name: "flour", quantity: 2, unit: "cups" }],
                steps: [{ instruction: "Mix and cook." }],
              }),
            },
          },
        ],
      }),
    });

    const result = await readRecipeFromImages([JPEG_DATA, JPEG_DATA], { apiKey: "key", fetchFn });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.title).toBe("Pancakes");
    const [, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(fetchFn.mock.calls[0][0]).toBe(GROQ_CHAT_URL);
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe(GROQ_VISION_MODEL);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0].content.filter((part: { type: string }) => part.type === "image_url")).toHaveLength(2);
  });

  it("maps Groq 429 to a retryable error", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    const result = await readRecipeFromImages([JPEG_DATA], { apiKey: "key", fetchFn });
    expect(result).toMatchObject({ ok: false, status: 429 });
  });

  it("maps an unknown Groq model to 502", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: { message: "The model does not exist or you do not have access to it.", code: "model_not_found" },
      }),
    });
    const result = await readRecipeFromImages([JPEG_DATA], { apiKey: "key", fetchFn });
    expect(result).toMatchObject({ ok: false, status: 502 });
  });
});
