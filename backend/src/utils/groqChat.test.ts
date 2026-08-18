import { describe, it, expect, vi } from "vitest";
import {
  fetchGroqChat,
  parseGroqChatPayload,
  GROQ_CHAT_URL,
  GROQ_CHAT_MODEL,
} from "./groqChat.js";

describe("parseGroqChatPayload", () => {
  it("reads assistant content from a chat completion payload", () => {
    expect(
      parseGroqChatPayload({
        choices: [{ message: { role: "assistant", content: "  Use butter.  " } }],
      })
    ).toBe("Use butter.");
  });

  it("returns null for empty or malformed payloads", () => {
    expect(parseGroqChatPayload(null)).toBeNull();
    expect(parseGroqChatPayload({})).toBeNull();
    expect(parseGroqChatPayload({ choices: [] })).toBeNull();
    expect(parseGroqChatPayload({ choices: [{ message: { content: "   " } }] })).toBeNull();
  });
});

describe("fetchGroqChat", () => {
  it("posts messages to Groq and returns the reply", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "Try oat milk." } }],
      }),
    });

    const result = await fetchGroqChat(
      [{ role: "user", content: "What can I use instead of milk?" }],
      { apiKey: "test-key", fetchFn }
    );

    expect(result).toEqual({ ok: true, kind: "reply", reply: "Try oat milk." });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(GROQ_CHAT_URL);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe(GROQ_CHAT_MODEL);
    expect(body.messages[0].content).toBe("What can I use instead of milk?");
    expect(body.tools).toBeUndefined();
  });

  it("forwards tool definitions and parses tool_calls", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
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
          },
        ],
      }),
    });

    const tools = [
      {
        type: "function" as const,
        function: { name: "search_recipes", description: "Search", parameters: { type: "object" } },
      },
    ];
    const result = await fetchGroqChat([{ role: "user", content: "What chicken recipes do I have?" }], {
      apiKey: "test-key",
      fetchFn,
      tools,
    });

    expect(result).toMatchObject({
      ok: true,
      kind: "tool_calls",
      toolCalls: [{ id: "call_1", function: { name: "search_recipes" } }],
    });
    const body = JSON.parse(String(fetchFn.mock.calls[0][1].body));
    expect(body.tools).toEqual(tools);
    expect(body.tool_choice).toBe("auto");
  });

  it("maps 429 to a clear busy message", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    });

    const result = await fetchGroqChat([{ role: "user", content: "Hi" }], {
      apiKey: "test-key",
      fetchFn,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(429);
      expect(result.error).toMatch(/busy/i);
    }
  });

  it("maps network failure to a generic error", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("network"));
    const result = await fetchGroqChat([{ role: "user", content: "Hi" }], {
      apiKey: "test-key",
      fetchFn,
    });
    expect(result).toMatchObject({ ok: false, status: 502 });
  });

  it("maps abort to a timeout error", async () => {
    const abortErr = new Error("aborted");
    abortErr.name = "AbortError";
    const fetchFn = vi.fn().mockRejectedValue(abortErr);
    const result = await fetchGroqChat([{ role: "user", content: "Hi" }], {
      apiKey: "test-key",
      fetchFn,
    });
    expect(result).toMatchObject({ ok: false, status: 504 });
  });
});
