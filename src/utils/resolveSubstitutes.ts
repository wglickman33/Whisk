import { findFallbackSubstitutes } from "./substituteLookup";

export type SubstituteResolution = {
  substitutes: string[];
  noSubstitute: boolean;
  source: "api" | "fallback" | "none";
};

export async function resolveSubstitutes(
  ingredientName: string,
  fetchApi: (name: string) => Promise<string[]>,
  findFallback: (name: string) => string[] = findFallbackSubstitutes
): Promise<SubstituteResolution> {
  try {
    const apiResults = await fetchApi(ingredientName);
    if (apiResults.length > 0) {
      return {
        substitutes: apiResults,
        noSubstitute: false,
        source: "api",
      };
    }

    const fallback = findFallback(ingredientName);
    return {
      substitutes: fallback,
      noSubstitute: fallback.length === 0,
      source: fallback.length > 0 ? "fallback" : "none",
    };
  } catch {
    const fallback = findFallback(ingredientName);
    return {
      substitutes: fallback,
      noSubstitute: fallback.length === 0,
      source: fallback.length > 0 ? "fallback" : "none",
    };
  }
}
