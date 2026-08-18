export const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_CHAT_MODEL = "openai/gpt-oss-120b";

export type GroqToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type GroqChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: GroqToolCall[];
};

export type GroqToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type GroqChatSuccess =
  | { ok: true; kind: "reply"; reply: string }
  | { ok: true; kind: "tool_calls"; message: GroqChatMessage; toolCalls: GroqToolCall[] };
export type GroqChatFailure = { ok: false; status: number; error: string };
export type GroqChatResult = GroqChatSuccess | GroqChatFailure;

export function parseGroqToolCalls(raw: unknown): GroqToolCall[] {
  if (!Array.isArray(raw)) return [];
  const calls: GroqToolCall[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const fn = rec.function;
    if (!fn || typeof fn !== "object") continue;
    const name = (fn as { name?: unknown }).name;
    const args = (fn as { arguments?: unknown }).arguments;
    const id = rec.id;
    if (typeof id !== "string" || !id.trim()) continue;
    if (typeof name !== "string" || !name.trim()) continue;
    calls.push({
      id,
      type: "function",
      function: {
        name,
        arguments: typeof args === "string" ? args : "{}",
      },
    });
  }
  return calls;
}

export function parseGroqChatPayload(data: unknown): string | null {
  const parsed = parseGroqChatResponse(data);
  return parsed?.kind === "reply" ? parsed.reply : null;
}

export function parseGroqChatResponse(data: unknown): GroqChatSuccess | null {
  if (!data || typeof data !== "object") return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  if (!first || typeof first !== "object") return null;
  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== "object") return null;
  const rec = message as Record<string, unknown>;
  const toolCalls = parseGroqToolCalls(rec.tool_calls);
  if (toolCalls.length > 0) {
    return {
      ok: true,
      kind: "tool_calls",
      message: {
        role: "assistant",
        content: typeof rec.content === "string" ? rec.content : null,
        tool_calls: toolCalls,
      },
      toolCalls,
    };
  }
  const content = rec.content;
  if (typeof content !== "string" || !content.trim()) return null;
  return { ok: true, kind: "reply", reply: content.trim() };
}

export async function fetchGroqChat(
  messages: GroqChatMessage[],
  options: {
    apiKey: string;
    fetchFn?: typeof fetch;
    timeoutMs?: number;
    model?: string;
    tools?: GroqToolDefinition[];
  }
): Promise<GroqChatResult> {
  const fetchFn = options.fetchFn ?? fetch;
  const timeoutMs = options.timeoutMs ?? 45_000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model ?? GROQ_CHAT_MODEL,
        messages,
        ...(options.tools && options.tools.length > 0
          ? { tools: options.tools, tool_choice: "auto" }
          : {}),
      }),
      signal: controller.signal,
    });

    if (response.status === 429) {
      return {
        ok: false,
        status: 429,
        error: "Sous is busy right now. Try again in a moment.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: 502,
        error: "Sous could not reply right now. Try again.",
      };
    }

    const data = await response.json();
    const parsed = parseGroqChatResponse(data);
    if (!parsed) {
      return {
        ok: false,
        status: 502,
        error: "Sous returned an empty reply. Try again.",
      };
    }

    return parsed;
  } catch (err) {
    const aborted =
      (err instanceof Error && err.name === "AbortError") ||
      (typeof err === "object" && err !== null && "name" in err && (err as { name: string }).name === "AbortError");
    if (aborted) {
      return {
        ok: false,
        status: 504,
        error: "Sous took too long to reply. Try again.",
      };
    }
    return {
      ok: false,
      status: 502,
      error: "Sous could not reply right now. Try again.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
