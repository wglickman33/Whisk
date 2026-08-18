import { describe, it, expect, vi } from "vitest";
import { runSousAgent, MAX_SOUS_TOOL_ROUNDS } from "./sousAgent.js";
import type { GroqChatMessage, GroqChatResult } from "./groqChat.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";

describe("runSousAgent", () => {
  it("returns a plain reply without executing tools", async () => {
    const fetchGroqChat = vi.fn().mockResolvedValue({
      ok: true,
      kind: "reply",
      reply: "Brown the butter over medium heat.",
    });
    const executeTool = vi.fn();

    const result = await runSousAgent(
      USER_ID,
      [{ role: "user", content: "How do I brown butter?" }],
      { apiKey: "key", fetchGroqChat, executeTool }
    );

    expect(result).toEqual({ ok: true, reply: "Brown the butter over medium heat." });
    expect(executeTool).not.toHaveBeenCalled();
    expect(fetchGroqChat).toHaveBeenCalledTimes(1);
    const [, options] = fetchGroqChat.mock.calls[0] as [GroqChatMessage[], { tools: unknown[] }];
    expect(options.tools).toHaveLength(5);
  });

  it("runs a short tool chain then returns the model reply", async () => {
    const fetchGroqChat = vi
      .fn()
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
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_2",
              type: "function",
              function: {
                name: "get_recipe_ingredients",
                arguments: '{"recipe_id":"550e8400-e29b-41d4-a716-446655440000"}',
              },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_2",
            type: "function",
            function: {
              name: "get_recipe_ingredients",
              arguments: '{"recipe_id":"550e8400-e29b-41d4-a716-446655440000"}',
            },
          },
        ],
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Lemon Chicken uses chicken thighs and lemon.",
      } satisfies GroqChatResult);

    const executeTool = vi
      .fn()
      .mockResolvedValueOnce(JSON.stringify({ count: 1, recipes: [{ id: "550e8400-e29b-41d4-a716-446655440000" }] }))
      .mockResolvedValueOnce(JSON.stringify({ title: "Lemon Chicken", ingredients: [{ name: "chicken thighs" }] }));

    const result = await runSousAgent(
      USER_ID,
      [{ role: "user", content: "What chicken recipes do I have?" }],
      { apiKey: "key", fetchGroqChat, executeTool }
    );

    expect(result).toEqual({
      ok: true,
      reply: "Lemon Chicken uses chicken thighs and lemon.",
    });
    expect(executeTool).toHaveBeenCalledTimes(2);
    expect(executeTool).toHaveBeenNthCalledWith(1, USER_ID, "search_recipes", '{"query":"chicken"}');
    expect(executeTool).toHaveBeenNthCalledWith(
      2,
      USER_ID,
      "get_recipe_ingredients",
      '{"recipe_id":"550e8400-e29b-41d4-a716-446655440000"}'
    );
    expect(fetchGroqChat).toHaveBeenCalledTimes(3);
  });

  it("emits live tool events as each lookup starts and finishes", async () => {
    const fetchGroqChat = vi
      .fn()
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
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Lemon Chicken is in your recipes.",
      } satisfies GroqChatResult);
    const executeTool = vi.fn().mockResolvedValue(
      JSON.stringify({ count: 1, recipes: [{ title: "Lemon Chicken" }] })
    );
    const onEvent = vi.fn();

    await runSousAgent(USER_ID, [{ role: "user", content: "Any chicken?" }], {
      apiKey: "key",
      fetchGroqChat,
      executeTool,
      onEvent,
    });

    expect(onEvent.mock.calls.map((call) => call[0])).toEqual([
      {
        type: "tool.start",
        id: "call_1",
        name: "search_recipes",
        input: { query: "chicken" },
      },
      {
        type: "tool.result",
        id: "call_1",
        name: "search_recipes",
        input: { query: "chicken" },
        output: { count: 1, recipes: [{ title: "Lemon Chicken" }] },
      },
    ]);
  });

  it("passes empty search results back to the model instead of inventing recipes", async () => {
    const fetchGroqChat = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_empty",
              type: "function",
              function: { name: "search_recipes", arguments: '{"query":"lasagna"}' },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_empty",
            type: "function",
            function: { name: "search_recipes", arguments: '{"query":"lasagna"}' },
          },
        ],
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "I could not find a matching saved recipe for lasagna.",
      } satisfies GroqChatResult);
    const executeTool = vi.fn().mockResolvedValue(JSON.stringify({ count: 0, recipes: [] }));

    const result = await runSousAgent(
      USER_ID,
      [{ role: "user", content: "Do I have a lasagna recipe?" }],
      { apiKey: "key", fetchGroqChat, executeTool }
    );

    expect(result).toEqual({
      ok: true,
      reply: "I could not find a matching saved recipe for lasagna.",
    });
    const secondMessages = fetchGroqChat.mock.calls[1][0] as GroqChatMessage[];
    const toolMessage = secondMessages.find((message) => message.role === "tool");
    expect(toolMessage?.content).toBe(JSON.stringify({ count: 0, recipes: [] }));
  });

  it("stops if the model never produces a reply", async () => {
    const fetchGroqChat = vi.fn().mockResolvedValue({
      ok: true,
      kind: "tool_calls",
      message: {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call_loop",
            type: "function",
            function: { name: "search_recipes", arguments: '{"query":"x"}' },
          },
        ],
      },
      toolCalls: [
        {
          id: "call_loop",
          type: "function",
          function: { name: "search_recipes", arguments: '{"query":"x"}' },
        },
      ],
    });
    const executeTool = vi.fn().mockResolvedValue(JSON.stringify({ count: 0, recipes: [] }));

    const result = await runSousAgent(USER_ID, [{ role: "user", content: "Find pasta" }], {
      apiKey: "key",
      fetchGroqChat,
      executeTool,
    });

    expect(result.ok).toBe(false);
    expect(fetchGroqChat).toHaveBeenCalledTimes(MAX_SOUS_TOOL_ROUNDS);
  });

  it("forwards Groq failures without calling tools", async () => {
    const fetchGroqChat = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      error: "Sous is busy right now. Try again in a moment.",
    });
    const executeTool = vi.fn();
    const result = await runSousAgent(USER_ID, [{ role: "user", content: "Hi" }], {
      apiKey: "key",
      fetchGroqChat,
      executeTool,
    });
    expect(result).toMatchObject({ ok: false, status: 429 });
    expect(executeTool).not.toHaveBeenCalled();
  });

  it("chains search, ingredients, substitute, and a shopping list proposal", async () => {
    const recipeId = "550e8400-e29b-41d4-a716-446655440000";
    const listId = "770e8400-e29b-41d4-a716-446655440000";
    const fetchGroqChat = vi
      .fn()
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
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_2",
              type: "function",
              function: {
                name: "get_recipe_ingredients",
                arguments: `{"recipe_id":"${recipeId}"}`,
              },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_2",
            type: "function",
            function: {
              name: "get_recipe_ingredients",
              arguments: `{"recipe_id":"${recipeId}"}`,
            },
          },
        ],
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_3",
              type: "function",
              function: { name: "check_substitute", arguments: '{"ingredient":"heavy cream"}' },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_3",
            type: "function",
            function: { name: "check_substitute", arguments: '{"ingredient":"heavy cream"}' },
          },
        ],
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_4",
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
            id: "call_4",
            type: "function",
            function: {
              name: "add_to_shopping_list",
              arguments: '{"items":[{"name":"coconut cream"}]}',
            },
          },
        ],
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Lemon Chicken uses heavy cream. Coconut cream works. Confirm below to add it.",
      } satisfies GroqChatResult);

    const executeTool = vi
      .fn()
      .mockResolvedValueOnce(JSON.stringify({ count: 1, recipes: [{ id: recipeId, title: "Lemon Chicken" }] }))
      .mockResolvedValueOnce(
        JSON.stringify({
          title: "Lemon Chicken",
          ingredients: [{ name: "heavy cream" }, { name: "chicken thighs" }],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          ingredient: "heavy cream",
          substitutes: [{ text: "full-fat coconut cream (1:1, for cooking)" }],
          source: "fallback",
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          needsConfirmation: true,
          added: false,
          listId,
          listName: "Groceries",
          items: [{ name: "coconut cream" }],
        })
      );

    const result = await runSousAgent(
      USER_ID,
      [
        {
          role: "user",
          content: "I want to make something with chicken but I'm out of heavy cream",
        },
      ],
      { apiKey: "key", fetchGroqChat, executeTool }
    );

    expect(result).toEqual({
      ok: true,
      reply: "Lemon Chicken uses heavy cream. Coconut cream works. Confirm below to add it.",
      pendingAction: {
        type: "add_to_shopping_list",
        listId,
        listName: "Groceries",
        items: [{ name: "coconut cream", category: null, note: null, quantity: null }],
      },
    });
    expect(executeTool).toHaveBeenCalledTimes(4);
    expect(fetchGroqChat).toHaveBeenCalledTimes(5);
  });
});
