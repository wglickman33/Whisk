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
    expect(result.recipe.description).toContain("Spicy glaze");
    expect(result.recipe.servingUnit).toBe("Servings");
    expect(result.recipe.tagLabels).toEqual(["Fish", "Spicy"]);
    expect(result.recipe.ingredients).toHaveLength(2);
    expect(result.recipe.ingredients[1].quantity).toBe(0.5);
    expect(result.recipe.steps).toHaveLength(1);
    expect(result.recipe.steps[0].timerMinutes).toBe(18);
  });

  it("rejects non-recipes and incomplete extractions", () => {
    expect(parseVisionRecipeJson('{"isRecipe":false}').ok).toBe(false);
    expect(
      parseVisionRecipeJson(JSON.stringify({ isRecipe: true, title: "Soup", ingredients: [], steps: [] }))
    ).toMatchObject({ status: 422 });
    expect(
      parseVisionRecipeJson(
        JSON.stringify({ isRecipe: true, title: "Soup", ingredients: ["stock"], steps: [] })
      )
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
    expect(result.recipe.description).toMatch(/Pancakes/i);
    expect(result.recipe.tagLabels.length).toBeGreaterThanOrEqual(2);
  });

  it("collects sauce ingredients and directions when keys differ", () => {
    const result = parseVisionRecipeJson(
      JSON.stringify({
        isRecipe: true,
        title: "Schnitzel",
        ingredients: [{ name: "thin chicken cutlets", quantity: 1.5, unit: "lb" }],
        stickySauce: [{ item: "honey", quantity: 0.25, unit: "cup" }],
        directions: [{ text: "Bake until crispy." }],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.ingredients.map((row) => row.name)).toEqual(["thin chicken cutlets", "honey"]);
    expect(result.recipe.steps[0].instruction).toBe("Bake until crispy.");
  });

  it("capitalizes Servings and keeps a description and tags", () => {
    const result = parseVisionRecipeJson(
      JSON.stringify({
        isRecipe: true,
        title: "Schnitzel",
        description: "Crispy baked chicken with a sticky chili-honey sauce.",
        servingUnit: "servings",
        tags: ["savory", "Chicken", "savory"],
        ingredients: ["chicken"],
        steps: ["bake"],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.servingUnit).toBe("Servings");
    expect(result.recipe.description).toContain("Crispy baked chicken");
    expect(result.recipe.tagLabels).toEqual(["savory", "Chicken"]);
  });

  it("fills name, description, and tags when Groq omits them", () => {
    const result = parseVisionRecipeJson(
      JSON.stringify({
        isRecipe: true,
        ingredients: [{ name: "salmon", quantity: 1, unit: "lb" }, { name: "lemon" }],
        steps: ["Roast until flaky."],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.title).toBe("salmon");
    expect(result.recipe.description).toMatch(/salmon/i);
    expect(result.recipe.tagLabels.length).toBeGreaterThanOrEqual(2);
    expect(result.recipe.tagLabels).toContain("Fish");
    expect(result.recipe.ingredients).toHaveLength(2);
    expect(result.recipe.steps).toHaveLength(1);
  });

  it("reads a nested recipe object and grouped ingredient lists", () => {
    const result = parseVisionRecipeJson(
      JSON.stringify({
        isRecipe: true,
        recipe: {
          name: "Lazy Girl Saucy Schnitzel",
          ingredients: {
            chicken: [{ item: "thin chicken cutlets", quantity: 1.5, unit: "lb" }],
            sauce: "1/4 cup honey\n2 tbsp chili sauce",
          },
          method: ["Bake until crispy.", "Toss with sauce."],
        },
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.title).toBe("Lazy Girl Saucy Schnitzel");
    expect(result.recipe.description).toBeTruthy();
    expect(result.recipe.tagLabels.length).toBeGreaterThanOrEqual(2);
    expect(result.recipe.ingredients.map((row) => row.name)).toEqual([
      "thin chicken cutlets",
      "1/4 cup honey",
      "2 tbsp chili sauce",
    ]);
    expect(result.recipe.steps).toHaveLength(2);
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
    expect(body.reasoning_effort).toBe("none");
    expect(body.max_completion_tokens).toBe(3072);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0].content.filter((part: { type: string }) => part.type === "image_url")).toHaveLength(2);
  });

  it("maps Groq 429 to a retryable error", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    const result = await readRecipeFromImages([JPEG_DATA], { apiKey: "key", fetchFn });
    expect(result).toMatchObject({ ok: false, status: 429 });
  });

  it("asks for fewer photos when Groq rejects the token size", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 413,
      json: async () => ({
        error: {
          message: "Request too large for model on tokens per minute (TPM): Limit 8000, Requested 13085",
          code: "rate_limit_exceeded",
        },
      }),
    });
    const result = await readRecipeFromImages([JPEG_DATA, JPEG_DATA], { apiKey: "key", fetchFn });
    expect(result).toMatchObject({ ok: false, status: 429 });
    if (!result.ok) expect(result.error).toMatch(/too large together/i);
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
