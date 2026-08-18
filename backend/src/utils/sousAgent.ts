import {
  fetchGroqChat,
  type GroqChatFailure,
  type GroqChatMessage,
} from "./groqChat.js";
import {
  executeSousTool,
  parseSousPendingAction,
  SOUS_TOOLS,
  type SousPendingAddToList,
} from "./sousTools.js";
import { parseJsonValue } from "./sse.js";

export const SOUS_SYSTEM_PROMPT =
  "You are Sous, Whisk's kitchen assistant. Answer cooking questions clearly and briefly. " +
  "You can look up the signed-in user's saved recipes, ingredient substitutes, and shopping lists. " +
  "Use search_recipes and get_recipe_ingredients for saved recipes. Use check_substitute when they are missing an ingredient. " +
  "Use get_shopping_list to read lists, and add_to_shopping_list only to propose items. " +
  "add_to_shopping_list never writes. The chat will show Add to list / Not now buttons. Never say you already added items. " +
  "Never invent a recipe, recipe id, ingredient, substitute, or shopping list item that a tool did not return. " +
  "If a tool returns no matches, an empty list, noSubstitute, or an error, tell the user that. Do not fill the gap with made-up Whisk data. " +
  "General cooking technique questions that do not need their recipes, substitutes, or lists may be answered without tools. Keep replies short.";

export const MAX_SOUS_TOOL_ROUNDS = 6;

export type SousAgentEvent =
  | { type: "tool.start"; id: string; name: string; input: unknown }
  | { type: "tool.result"; id: string; name: string; input: unknown; output: unknown };

export type SousAgentSuccess = {
  ok: true;
  reply: string;
  pendingAction?: SousPendingAddToList;
};
export type SousAgentResult = SousAgentSuccess | GroqChatFailure;

type FetchGroqChat = typeof fetchGroqChat;
type ExecuteTool = typeof executeSousTool;

export async function runSousAgent(
  userId: string,
  conversation: { role: "user" | "assistant"; content: string }[],
  options: {
    apiKey: string;
    fetchGroqChat?: FetchGroqChat;
    executeTool?: ExecuteTool;
    onEvent?: (event: SousAgentEvent) => void;
  }
): Promise<SousAgentResult> {
  const callGroq = options.fetchGroqChat ?? fetchGroqChat;
  const runTool = options.executeTool ?? executeSousTool;

  const messages: GroqChatMessage[] = [
    { role: "system", content: SOUS_SYSTEM_PROMPT },
    ...conversation,
  ];

  let pendingAction: SousPendingAddToList | undefined;

  for (let round = 0; round < MAX_SOUS_TOOL_ROUNDS; round += 1) {
    const result = await callGroq(messages, {
      apiKey: options.apiKey,
      tools: SOUS_TOOLS,
    });
    if (!result.ok) return result;

    if (result.kind === "reply") {
      return pendingAction
        ? { ok: true, reply: result.reply, pendingAction }
        : { ok: true, reply: result.reply };
    }

    messages.push(result.message);
    for (const call of result.toolCalls) {
      const input = parseJsonValue(call.function.arguments);
      options.onEvent?.({
        type: "tool.start",
        id: call.id,
        name: call.function.name,
        input,
      });
      const content = await runTool(userId, call.function.name, call.function.arguments);
      const output = parseJsonValue(content);
      options.onEvent?.({
        type: "tool.result",
        id: call.id,
        name: call.function.name,
        input,
        output,
      });
      const proposed = parseSousPendingAction(call.function.name, content);
      if (proposed) pendingAction = proposed;
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content,
      });
    }
  }

  return {
    ok: false,
    status: 502,
    error: "Sous could not finish looking that up. Try a simpler question.",
  };
}
