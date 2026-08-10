import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";

const USER_ID = "11111111-1111-1111-1111-111111111111";

const fetchSpoonacularSubstitutes = vi.fn();

vi.mock("../utils/spoonacularSubstitutes.js", () => ({
  fetchSpoonacularSubstitutes: (...args: unknown[]) => fetchSpoonacularSubstitutes(...args),
}));

const { createApp } = await import("../app.js");

function authHeader() {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const token = jwt.sign({ sub: USER_ID, email: "test@example.com" }, secret);
  return { Authorization: `Bearer ${token}` };
}

describe("GET /api/ingredients/substitutes", () => {
  const app = createApp();

  beforeEach(() => {
    fetchSpoonacularSubstitutes.mockReset();
    delete process.env.SPOONACULAR_API_KEY;
  });

  it("validates the ingredient name", async () => {
    const res = await request(app)
      .get("/api/ingredients/substitutes")
      .set(authHeader());

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ingredient name/i);
  });

  it("returns an empty list when no API key is configured", async () => {
    const res = await request(app)
      .get("/api/ingredients/substitutes?name=butter")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.substitutes).toEqual([]);
    expect(fetchSpoonacularSubstitutes).not.toHaveBeenCalled();
  });

  it("proxies Spoonacular when an API key exists", async () => {
    process.env.SPOONACULAR_API_KEY = "test-key";
    fetchSpoonacularSubstitutes.mockResolvedValue(["olive oil", "margarine"]);

    const res = await request(app)
      .get("/api/ingredients/substitutes?name=butter")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.substitutes).toEqual(["olive oil", "margarine"]);
    expect(fetchSpoonacularSubstitutes).toHaveBeenCalledWith("butter", {
      apiKey: "test-key",
      intolerances: "",
      diet: "",
    });
  });

  it("forwards dietary preference query flags to Spoonacular params", async () => {
    process.env.SPOONACULAR_API_KEY = "test-key";
    fetchSpoonacularSubstitutes.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/ingredients/substitutes?name=butter&dairyFree=1&vegan=1&nutFree=1")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(fetchSpoonacularSubstitutes).toHaveBeenCalledWith("butter", {
      apiKey: "test-key",
      intolerances: "dairy,peanut,tree nut",
      diet: "vegan",
    });
  });
});
