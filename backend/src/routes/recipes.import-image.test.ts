import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const readRecipeFromImages = vi.fn();
const JPEG_B64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).toString("base64");
const JPEG_DATA = `data:image/jpeg;base64,${JPEG_B64}`;

vi.mock("../utils/recipeImageImport.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/recipeImageImport.js")>();
  return {
    ...actual,
    readRecipeFromImages: (...args: unknown[]) => readRecipeFromImages(...args),
  };
});

const { createApp } = await import("../app.js");

function authHeader() {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const token = jwt.sign({ sub: USER_ID, email: "test@example.com" }, secret);
  return { Authorization: `Bearer ${token}` };
}

describe("POST /api/recipes/import-image", () => {
  const app = createApp();

  beforeEach(() => {
    readRecipeFromImages.mockReset();
    delete process.env.GROQ_API_KEY;
  });

  it("requires authentication", async () => {
    const res = await request(app).post("/api/recipes/import-image").send({ image: JPEG_DATA });
    expect(res.status).toBe(401);
    expect(readRecipeFromImages).not.toHaveBeenCalled();
  });

  it("returns 503 when Groq is not configured", async () => {
    const res = await request(app)
      .post("/api/recipes/import-image")
      .set(authHeader())
      .send({ image: JPEG_DATA });
    expect(res.status).toBe(503);
    expect(readRecipeFromImages).not.toHaveBeenCalled();
  });

  it("rejects a missing photo", async () => {
    process.env.GROQ_API_KEY = "test-key";
    const res = await request(app).post("/api/recipes/import-image").set(authHeader()).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/photo is required/i);
  });

  it("returns a draft and does not persist a recipe", async () => {
    process.env.GROQ_API_KEY = "test-key";
    readRecipeFromImages.mockResolvedValue({
      ok: true,
      recipe: {
        title: "Pancakes",
        description: null,
        servings: 4,
        servingUnit: "servings",
        ingredients: [{ name: "flour", quantity: 2, unit: "cups", notes: null, isOptional: false }],
        steps: [{ instruction: "Mix and cook.", timerMinutes: null }],
      },
    });

    const res = await request(app)
      .post("/api/recipes/import-image")
      .set(authHeader())
      .send({ images: [JPEG_DATA, JPEG_DATA] });

    expect(res.status).toBe(200);
    expect(res.body.recipe.title).toBe("Pancakes");
    expect(res.body.id).toBeUndefined();
    expect(readRecipeFromImages).toHaveBeenCalledTimes(1);
    expect(readRecipeFromImages.mock.calls[0][0]).toEqual([JPEG_DATA, JPEG_DATA]);
  });

  it("forwards a non-recipe photo as 422", async () => {
    process.env.GROQ_API_KEY = "test-key";
    readRecipeFromImages.mockResolvedValue({
      ok: false,
      status: 422,
      error: "Those photos do not look like a recipe. Try cookbook pages, a card, or screenshots.",
    });

    const res = await request(app)
      .post("/api/recipes/import-image")
      .set(authHeader())
      .send({ image: JPEG_DATA });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/do not look like a recipe/i);
  });
});
