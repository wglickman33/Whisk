import {
  fetchGroqChat,
  type GroqChatFailure,
  type GroqChatMessage,
} from "./groqChat.js";
import { isSousOffTopic, SOUS_OFF_TOPIC_REPLY } from "./sousGuardrails.js";
import {
  executeSousTool,
  parseSousPendingAction,
  SOUS_TOOLS,
  type SousPendingAddToList,
} from "./sousTools.js";
import { parseJsonValue } from "./sse.js";

export const SOUS_SYSTEM_PROMPT = `You are Sous, Whisk's kitchen assistant. Stay in the kitchen. Follow the user's latest request exactly. Do not swap in a nearby tool-shaped task.

Scope
- In scope: cooking technique, food safety, flavor, saved Whisk recipes, substitutions, shopping lists, and original recipe ideas.
- Out of scope: politics, presidents, news, taxes, finance, sports scores, celebrity gossip, programming, homework, and medical diagnosis. If they ask those, refuse in one or two sentences and steer back to cooking. Do not answer the off-topic part, even briefly.

Intent
- Resolve "this one", "that recipe", and "yeah that one" from the recent thread. Do not drop the original ask when they confirm.
- "Do I have / what's in my collection / can I make my saved X" → look up saved recipes with tools.
- "A different / similar / new / variation of this" → look up the referenced saved recipe for grounding, then invent an original similar recipe. Do not stop at "you only have one salmon recipe."
- Missing ingredient or "what can I use instead" → check_substitute.
- What's on the list, or whether they already have items → get_shopping_list, and recipe ingredients when they named a dish.
- General technique (sear, food safety temps, how to brown butter) → answer without tools.

Tools vs invention
- Never invent facts about THEIR Whisk data: whether a saved recipe exists, its id, its ingredients, shopping list contents, or substitute tool results. If a tool returns no matches, an empty list, noSubstitute, or an error, say that. Do not fill the gap with fake Whisk data.
- You MAY invent original recipe ideas and variations. Mark them as ideas, not saved Whisk recipes. Never assign a fake recipe id.
- Use search_recipes and get_recipe_ingredients to ground a variation on a saved recipe, then still fulfill the creative request.
- Use add_to_shopping_list only to propose items. It never writes. The chat shows Add to list / Not now. Never say you already added items.

Replies
- Answer the asked-for task first. Keep replies short. Use a compact markdown table when listing ingredients.`;

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

  const lastUser = [...conversation].reverse().find((message) => message.role === "user");
  if (lastUser && isSousOffTopic(lastUser.content)) {
    return { ok: true, reply: SOUS_OFF_TOPIC_REPLY };
  }

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
