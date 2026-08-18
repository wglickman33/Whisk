import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const LIST_ID = "770e8400-e29b-41d4-a716-446655440000";

const fetchGroqChat = vi.fn();
const shoppingListFindMany = vi.fn();
const shoppingListItemCreateMany = vi.fn();
const recipeFindMany = vi.fn();
const recipeFindFirst = vi.fn();

vi.mock("../utils/groqChat.js", () => ({
  fetchGroqChat: (...args: unknown[]) => fetchGroqChat(...args),
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    recipe: {
      findMany: (...args: unknown[]) => recipeFindMany(...args),
      findFirst: (...args: unknown[]) => recipeFindFirst(...args),
    },
    user: { findUnique: vi.fn() },
    shoppingList: { findMany: (...args: unknown[]) => shoppingListFindMany(...args) },
    shoppingListItem: { createMany: (...args: unknown[]) => shoppingListItemCreateMany(...args) },
  },
}));

const { createApp } = await import("../app.js");

function authHeader() {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const token = jwt.sign({ sub: USER_ID, email: "test@example.com" }, secret);
  return { Authorization: `Bearer ${token}` };
}

describe("POST /api/sous/chat", () => {
  const app = createApp();

  beforeEach(() => {
    fetchGroqChat.mockReset();
    shoppingListFindMany.mockReset();
    shoppingListItemCreateMany.mockReset();
    recipeFindMany.mockReset();
    recipeFindFirst.mockReset();
    delete process.env.GROQ_API_KEY;
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .post("/api/sous/chat")
      .send({ messages: [{ role: "user", content: "Hi" }] });

    expect(res.status).toBe(401);
    expect(fetchGroqChat).not.toHaveBeenCalled();
  });

  it("rejects an empty messages array", async () => {
    const res = await request(app)
      .post("/api/sous/chat")
      .set(authHeader())
      .send({ messages: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least one message/i);
  });

  it("rejects a last message that is not from the user", async () => {
    const res = await request(app)
      .post("/api/sous/chat")
      .set(authHeader())
      .send({ messages: [{ role: "assistant", content: "Hello" }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/last message/i);
  });

  it("returns 503 when Groq is not configured", async () => {
    const res = await request(app)
      .post("/api/sous/chat")
      .set(authHeader())
      .send({ messages: [{ role: "user", content: "Hi" }] });

    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/not configured/i);
    expect(fetchGroqChat).not.toHaveBeenCalled();
  });

  it("proxies a reply when Groq is configured", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchGroqChat.mockResolvedValue({ ok: true, kind: "reply", reply: "Use oat milk." });

    const res = await request(app)
      .post("/api/sous/chat")
      .set(authHeader())
      .send({
        messages: [
          { role: "user", content: "What can I use instead of milk?" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe("Use oat milk.");
    expect(fetchGroqChat).toHaveBeenCalledTimes(1);
    const [messages, options] = fetchGroqChat.mock.calls[0] as [
      { role: string; content: string }[],
      { apiKey: string },
    ];
    expect(options.apiKey).toBe("test-key");
    expect(messages[0].role).toBe("system");
    expect(messages[1]).toEqual({
      role: "user",
      content: "What can I use instead of milk?",
    });
    expect(res.body.pendingAction).toBeUndefined();
  });

  it("refuses off-topic questions without calling Groq", async () => {
    process.env.GROQ_API_KEY = "test-key";

    const res = await request(app)
      .post("/api/sous/chat")
      .set(authHeader())
      .send({ messages: [{ role: "user", content: "Who was the last president?" }] });

    expect(res.status).toBe(200);
    expect(res.body.reply).toMatch(/don't cover things like politics/i);
    expect(fetchGroqChat).not.toHaveBeenCalled();
  });

  it("returns a pending shopping list action without writing items", async () => {
    process.env.GROQ_API_KEY = "test-key";
    shoppingListFindMany.mockResolvedValue([
      { id: LIST_ID, name: "Groceries", items: [] },
    ]);
    fetchGroqChat
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_add",
              type: "function",
              function: {
                name: "add_to_shopping_list",
                arguments: '{"items":[{"name":"coconut cream"}]}',
              },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_add",
            type: "function",
            function: {
              name: "add_to_shopping_list",
              arguments: '{"items":[{"name":"coconut cream"}]}',
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Want me to add coconut cream?",
      });

    const res = await request(app)
      .post("/api/sous/chat")
      .set(authHeader())
      .send({ messages: [{ role: "user", content: "Add coconut cream" }] });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe("Want me to add coconut cream?");
    expect(res.body.pendingAction).toEqual({
      type: "add_to_shopping_list",
      listId: LIST_ID,
      listName: "Groceries",
      items: [{ name: "coconut cream", category: null, quantity: null, note: null }],
    });
    expect(shoppingListItemCreateMany).not.toHaveBeenCalled();
  });

  it("forwards Groq rate-limit failures", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchGroqChat.mockResolvedValue({
      ok: false,
      status: 429,
      error: "Sous is busy right now. Try again in a moment.",
    });

    const res = await request(app)
      .post("/api/sous/chat")
      .set(authHeader())
      .send({ messages: [{ role: "user", content: "Hi" }] });

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/busy/i);
  });

  it("streams tool events and the reply over SSE", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchGroqChat
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: { name: "search_recipes", arguments: '{"query":"chicken"}' },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "search_recipes", arguments: '{"query":"chicken"}' },
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Lemon Chicken is in your recipes.",
      });

    recipeFindMany.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Lemon Chicken",
        description: null,
        servings: 4,
        servingUnit: "servings",
        ingredients: [{ name: "chicken" }],
        tags: [],
        updatedAt: new Date(),
      },
    ]);

    const res = await request(app)
      .post("/api/sous/chat")
      .set(authHeader())
      .set("Accept", "text/event-stream")
      .send({ messages: [{ role: "user", content: "What chicken recipes do I have?" }] });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
    expect(res.text).toContain("event: tool.start");
    expect(res.text).toContain("event: tool.result");
    expect(res.text).toContain("event: reply");
    expect(res.text).toContain("Lemon Chicken is in your recipes.");
  });

  it("streams Groq failures as an error event", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchGroqChat.mockResolvedValue({
      ok: false,
      status: 429,
      error: "Sous is busy right now. Try again in a moment.",
    });

    const res = await request(app)
      .post("/api/sous/chat")
      .set(authHeader())
      .set("Accept", "text/event-stream")
      .send({ messages: [{ role: "user", content: "Hi" }] });

    expect(res.status).toBe(200);
    expect(res.text).toContain("event: error");
    expect(res.text).toMatch(/busy/i);
  });
});
