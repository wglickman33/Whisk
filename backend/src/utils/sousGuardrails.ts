export const SOUS_OFF_TOPIC_REPLY =
  "I can help with cooking, your saved recipes, substitutions, and shopping lists. I don't cover things like politics, news, or taxes. What are you making?";

const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(who|which).{0,40}\b(president|prime minister|senator|congress(?:wo)?man|governor)\b/i,
  /\b(last|current|former|next)\s+(us |u\.s\. |american )?(president|prime minister)\b/i,
  /\b(president|prime minister) of the (united states|usa|u\.s\.a?|america)\b/i,
  /\b(election|electoral college|white house|capitol hill|supreme court)\b/i,
  /\b(democrat|republican|political party|congress)\b/i,
  /\b(file|pay|owe|income|property|sales)\b.{0,24}\btaxes?\b/i,
  /\b(irs|tax (?:return|bracket|refund)|capital gains|401k|roth ira)\b/i,
  /\b(stock market|nasdaq|s&p|bitcoin|cryptocurrenc)/i,
  /\b(write|debug|fix).{0,24}\b(python|javascript|typescript|java|code|sql)\b/i,
  /\b(who won).{0,32}\b(game|match|super bowl|world cup|election)\b/i,
];

const KITCHEN_OVERRIDE =
  /\b(recipe|recipes|cook|cooking|bake|baking|ingredient|ingredients|substitut|shopping list|grocery|dinner|lunch|breakfast|meal|oven|stove|saute|sear|whisk)\b/i;

export function isSousOffTopic(text: string): boolean {
  const content = text.trim();
  if (!content) return false;
  if (KITCHEN_OVERRIDE.test(content)) return false;
  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(content));
}
