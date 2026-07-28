import * as cheerio from "cheerio";
import { assertSafeFetchUrl, safeFetch } from "./urlSafety.js";

export interface ScrapedRecipe {
  title: string;
  description: string | null;
  servings: number;
  sourceUrl: string;
  ingredients: { name: string; quantity: number; unit: string; notes: string | null }[];
  steps: { instruction: string; timerMinutes: number | null }[];
}

function parseIngredientLine(text: string): { name: string; quantity: number; unit: string; notes: string | null } {
  const trimmed = text.replace(/^[-•*]\s*/, "").trim();
  const match = trimmed.match(/^([\d./]+)\s*([a-zA-Z]+)?\s+(.+)$/);
  if (match) {
    let qty = parseFloat(match[1]);
    if (match[1].includes("/")) {
      const [num, den] = match[1].split("/").map(Number);
      qty = den ? num / den : num;
    }
    return {
      quantity: Number.isFinite(qty) ? qty : 1,
      unit: (match[2] ?? "").trim(),
      name: match[3].trim(),
      notes: null,
    };
  }
  return { name: trimmed, quantity: 1, unit: "", notes: null };
}

function fromJsonLd($: cheerio.CheerioAPI, url: string): ScrapedRecipe | null {
  const scripts = $('script[type="application/ld+json"]');
  for (const el of scripts.toArray()) {
    try {
      const raw = $(el).html();
      if (!raw) continue;
      const data = JSON.parse(raw);
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const recipe =
          node["@type"] === "Recipe"
            ? node
            : node["@graph"]?.find((n: { "@type"?: string }) => n["@type"] === "Recipe");
        if (!recipe) continue;

        const ingredients = (recipe.recipeIngredient ?? recipe.ingredients ?? []).map(
          (line: string) => parseIngredientLine(String(line))
        );

        const instructions = (recipe.recipeInstructions ?? [])
          .map((step: string | { text?: string }) =>
            typeof step === "string" ? step : step.text ?? ""
          )
          .filter(Boolean)
          .map((instruction: string) => ({ instruction, timerMinutes: null }));

        return {
          title: String(recipe.name ?? "Imported recipe").slice(0, 200),
          description: recipe.description ? String(recipe.description).slice(0, 5000) : null,
          servings: Number(recipe.recipeYield) > 0 ? Number(recipe.recipeYield) : 4,
          sourceUrl: url,
          ingredients: ingredients.slice(0, 100),
          steps: instructions.slice(0, 100),
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function fromHeuristics($: cheerio.CheerioAPI, url: string): ScrapedRecipe {
  const title =
    $('meta[property="og:title"]').attr("content") ??
    $("h1").first().text().trim() ??
    "Imported recipe";

  const description =
    $('meta[property="og:description"]').attr("content") ??
    $('meta[name="description"]').attr("content") ??
    null;

  const ingredientLines = $(
    '[class*="ingredient" i] li, [itemprop="recipeIngredient"], .wprm-recipe-ingredient, .tasty-recipes-ingredients li'
  )
    .toArray()
    .map((el) => $(el).text().trim())
    .filter(Boolean);

  const stepLines = $(
    '[class*="instruction" i] li, [itemprop="recipeInstructions"] li, .wprm-recipe-instruction, .tasty-recipes-instructions li'
  )
    .toArray()
    .map((el) => $(el).text().trim())
    .filter(Boolean);

  return {
    title: title.slice(0, 200),
    description: description?.slice(0, 5000) ?? null,
    servings: 4,
    sourceUrl: url,
    ingredients: ingredientLines.slice(0, 100).map(parseIngredientLine),
    steps: stepLines.slice(0, 100).map((instruction) => ({ instruction, timerMinutes: null })),
  };
}

export async function fetchAndScrapeRecipe(rawUrl: string): Promise<ScrapedRecipe> {
  const url = assertSafeFetchUrl(rawUrl);
  const response = await safeFetch(url.toString(), {
    headers: { "User-Agent": "WhiskRecipeImporter/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch recipe page (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    throw new Error("URL did not return an HTML page.");
  }

  const html = await response.text();
  if (html.length > 2_000_000) {
    throw new Error("Page is too large to import.");
  }

  const $ = cheerio.load(html);
  return fromJsonLd($, url.toString()) ?? fromHeuristics($, url.toString());
}
