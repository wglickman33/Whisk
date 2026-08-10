export const SPOONACULAR_SUBSTITUTES_URL =
  "https://api.spoonacular.com/food/ingredients/substitutes";

export function parseSubstitutesPayload(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];

  const substitutes = (data as { substitutes?: unknown }).substitutes;
  if (!Array.isArray(substitutes)) return [];

  return substitutes
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 20);
}

export async function fetchSpoonacularSubstitutes(
  ingredientName: string,
  options: {
    apiKey: string;
    fetchFn?: typeof fetch;
    timeoutMs?: number;
    intolerances?: string;
    diet?: string;
  }
): Promise<string[]> {
  const fetchFn = options.fetchFn ?? fetch;
  const timeoutMs = options.timeoutMs ?? 10_000;

  const url = new URL(SPOONACULAR_SUBSTITUTES_URL);
  url.searchParams.set("ingredientName", ingredientName);
  url.searchParams.set("apiKey", options.apiKey);
  if (options.intolerances?.trim()) {
    url.searchParams.set("intolerances", options.intolerances.trim());
  }
  if (options.diet?.trim()) {
    url.searchParams.set("diet", options.diet.trim());
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(url.toString(), { signal: controller.signal });
    if (!response.ok) return [];

    const data = await response.json();
    return parseSubstitutesPayload(data);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
