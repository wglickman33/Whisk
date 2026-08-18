import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("createApp", () => {
  it("responds on the health endpoint", async () => {
    const app = createApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.timestamp).toBe("string");
  });
});

describe("protected API routes", () => {
  const app = createApp();

  it("requires auth for shopping lists", async () => {
    const res = await request(app).get("/api/shopping-lists");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/authentication/i);
  });

  it("requires auth for ingredient substitutes", async () => {
    const res = await request(app).get("/api/ingredients/substitutes?name=milk");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/authentication/i);
  });

  it("requires auth for sous chat", async () => {
    const res = await request(app)
      .post("/api/sous/chat")
      .send({ messages: [{ role: "user", content: "Hi" }] });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/authentication/i);
  });
});
