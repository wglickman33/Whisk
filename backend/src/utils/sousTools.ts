import { prisma } from "../lib/prisma.js";
import {
  isValidUuid,
  LIMITS,
  sanitizeString,
  validateBulkShoppingListItems,
} from "./validation.js";
import type { GroqToolDefinition } from "./groqChat.js";
import {
  mapDietaryPreferencesToSpoonacular,
  parseDietaryPreferences,
} from "./dietaryPreferences.js";
import { fetchSpoonacularSubstitutes } from "./spoonacularSubstitutes.js";
import { resolveSubstitutes } from "./resolveSubstitutes.js";
import { findFallbackSubstitutes } from "./substituteLookup.js";

const SEARCH_LIMIT = 20;
const MAX_SERVINGS = 1000;

const recipeSearchInclude = {
  ingredients: { select: { name: true } },
  tags: { include: { tag: { select: { label: true } } } },
};

const userListWhere = (userId: string) => ({
  OR: [{ ownerUserId: userId }, { members: { some: { userId } } }],
});

export type SousShoppingListItem = {
  name: string;
  category?: string | null;
  quantity?: string | null;
  note?: string | null;
};

export type SousPendingAddToList = {
  type: "add_to_shopping_list";
  listId: string;
  listName: string;
  items: SousShoppingListItem[];
};

export const SOUS_TOOLS: GroqToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_recipes",
      description:
        "Search the signed-in user's saved Whisk recipes by title, description, ingredient, or tag. Use this whenever they ask what they can cook or whether they have a recipe.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search text, e.g. chicken, tomato soup, or a tag name.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recipe_ingredients",
      description:
        "Get ingredients for one of the user's recipes by id. Optionally scale quantities to a target serving count.",
      parameters: {
        type: "object",
        properties: {
          recipe_id: {
            type: "string",
            description: "The recipe id returned by search_recipes.",
          },
          servings: {
            type: "number",
            description: "Target servings. Omit to use the recipe's saved serving count.",
          },
        },
        required: ["recipe_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_substitute",
      description:
        "Look up substitutes for an ingredient using Whisk's substitution data. Use this when they are missing an ingredient or ask what they can use instead.",
      parameters: {
        type: "object",
        properties: {
          ingredient: {
            type: "string",
            description: "The ingredient to substitute, e.g. heavy cream.",
          },
        },
        required: ["ingredient"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_shopping_list",
      description:
        "Read the user's shopping lists and items. Use this when they ask what is on their list or whether they already have something.",
      parameters: {
        type: "object",
        properties: {
          list_id: {
            type: "string",
            description: "Optional shopping list id. Omit to use their first list.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_shopping_list",
      description:
        "Propose adding grocery items to a shopping list. This does not add anything yet. The user must confirm in the chat UI. Never claim items were added.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Items to propose. Each needs a name.",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "string" },
                note: { type: "string" },
                category: { type: "string" },
              },
              required: ["name"],
            },
          },
          list_id: {
            type: "string",
            description: "Optional shopping list id. Omit to use their first list.",
          },
        },
        required: ["items"],
      },
    },
  },
];

function matchesQuery(
  recipe: {
    title: string;
    description: string | null;
    ingredients: { name: string }[];
    tags: { tag: { label: string } }[];
  },
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (recipe.title.toLowerCase().includes(q)) return true;
  if (recipe.description?.toLowerCase().includes(q)) return true;
  if (recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q))) return true;
  if (recipe.tags.some((t) => t.tag.label.toLowerCase().includes(q))) return true;
  return false;
}

function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

function sanitizeProposedItems(raw: unknown): { error: string } | { items: SousShoppingListItem[] } {
  const error = validateBulkShoppingListItems(raw);
  if (error) return { error };
  const items = (raw as Record<string, unknown>[]).map((row) => ({
    name: sanitizeString(row.name, LIMITS.shoppingItemNameMax)!,
    category: sanitizeString(row.category, LIMITS.shoppingCategoryMax),
    quantity: sanitizeString(row.quantity, LIMITS.shoppingQuantityMax),
    note: sanitizeString(row.note, LIMITS.shoppingNoteMax),
  }));
  return { items };
}

export function parseSousPendingAction(
  toolName: string,
  content: string
): SousPendingAddToList | undefined {
  if (toolName !== "add_to_shopping_list") return undefined;
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (parsed?.needsConfirmation !== true) return undefined;
    if (typeof parsed.listId !== "string" || !isValidUuid(parsed.listId)) return undefined;
    if (typeof parsed.listName !== "string" || !parsed.listName.trim()) return undefined;
    const sanitized = sanitizeProposedItems(parsed.items);
    if ("error" in sanitized) return undefined;
    return {
      type: "add_to_shopping_list",
      listId: parsed.listId,
      listName: parsed.listName.trim(),
      items: sanitized.items,
    };
  } catch {
    return undefined;
  }
}

export async function searchRecipes(userId: string, query: string): Promise<string> {
  const recipes = await prisma.recipe.findMany({
    where: { userId },
    include: recipeSearchInclude,
    orderBy: { updatedAt: "desc" },
  });
  const matches = recipes.filter((recipe) => matchesQuery(recipe, query)).slice(0, SEARCH_LIMIT);
  return JSON.stringify({
    query: query.trim(),
    count: matches.length,
    recipes: matches.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      servings: recipe.servings,
      servingUnit: recipe.servingUnit,
    })),
  });
}

export async function getRecipeIngredients(
  userId: string,
  recipeId: string,
  servings?: number
): Promise<string> {
  if (!isValidUuid(recipeId)) {
    return JSON.stringify({ error: "Invalid recipe id." });
  }
  if (servings != null && (!Number.isFinite(servings) || servings <= 0 || servings > MAX_SERVINGS)) {
    return JSON.stringify({ error: "Servings must be a positive number." });
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, userId },
    include: {
      ingredients: { orderBy: { order: "asc" as const } },
    },
  });
  if (!recipe) {
    return JSON.stringify({ error: "Recipe not found." });
  }

  const baseServings = recipe.servings > 0 ? recipe.servings : 1;
  const targetServings = servings ?? recipe.servings;
  const scale = targetServings / baseServings;

  return JSON.stringify({
    id: recipe.id,
    title: recipe.title,
    savedServings: recipe.servings,
    servings: targetServings,
    servingUnit: recipe.servingUnit,
    ingredients: recipe.ingredients.map((ing) => ({
      name: ing.name,
      quantity: roundQuantity(ing.quantity * scale),
      unit: ing.unit,
      notes: ing.notes,
      isOptional: ing.isOptional,
    })),
  });
}

export async function checkSubstitute(userId: string, ingredient: string): Promise<string> {
  const name = ingredient.trim();
  if (!name) {
    return JSON.stringify({ error: "An ingredient name is required." });
  }
  if (name.length > 200) {
    return JSON.stringify({ error: "Ingredient name is too long." });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dietaryPreferences: true },
  });
  const prefs = parseDietaryPreferences(user?.dietaryPreferences);
  const { intolerances, diet } = mapDietaryPreferencesToSpoonacular(prefs);
  const apiKey = process.env.SPOONACULAR_API_KEY?.trim() ?? "";

  const result = await resolveSubstitutes(
    name,
    async (ingredientName) => {
      if (!apiKey) return [];
      return fetchSpoonacularSubstitutes(ingredientName, { apiKey, intolerances, diet });
    },
    findFallbackSubstitutes,
    prefs
  );

  return JSON.stringify({
    ingredient: name,
    substitutes: result.substitutes.map((option) => ({
      text: option.text,
      ...(option.sourcingNote ? { sourcingNote: option.sourcingNote } : {}),
    })),
    source: result.source,
    noSubstitute: result.noSubstitute,
    preferencesRelaxed: result.preferencesRelaxed,
    ...(result.preferencesRelaxed
      ? {
          note: "No option matched the user's dietary preferences, so unfiltered substitutes are shown. Mention they should check labels.",
        }
      : {}),
  });
}

async function findUserLists(userId: string) {
  return prisma.shoppingList.findMany({
    where: userListWhere(userId),
    include: {
      items: {
        orderBy: [{ checked: "asc" as const }, { createdAt: "asc" as const }],
        select: {
          id: true,
          name: true,
          category: true,
          quantity: true,
          note: true,
          checked: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getShoppingList(userId: string, listId?: string): Promise<string> {
  const lists = await findUserLists(userId);
  if (lists.length === 0) {
    return JSON.stringify({
      error: "No shopping list found. Ask them to create one on the Shopping list page.",
    });
  }

  let active = lists[0];
  if (listId) {
    if (!isValidUuid(listId)) {
      return JSON.stringify({ error: "Invalid shopping list id." });
    }
    const match = lists.find((list) => list.id === listId);
    if (!match) {
      return JSON.stringify({ error: "Shopping list not found." });
    }
    active = match;
  }

  return JSON.stringify({
    lists: lists.map((list) => ({
      id: list.id,
      name: list.name,
      itemCount: list.items.length,
    })),
    list: {
      id: active.id,
      name: active.name,
      items: active.items.map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        note: item.note,
        checked: item.checked,
      })),
    },
  });
}

export async function proposeAddToShoppingList(
  userId: string,
  rawItems: unknown,
  listId?: string
): Promise<string> {
  const sanitized = sanitizeProposedItems(rawItems);
  if ("error" in sanitized) {
    return JSON.stringify({ error: sanitized.error });
  }

  const lists = await findUserLists(userId);
  if (lists.length === 0) {
    return JSON.stringify({
      error: "No shopping list found. Ask them to create one on the Shopping list page. Do not claim you added items.",
    });
  }

  let active = lists[0];
  if (listId) {
    if (!isValidUuid(listId)) {
      return JSON.stringify({ error: "Invalid shopping list id." });
    }
    const match = lists.find((list) => list.id === listId);
    if (!match) {
      return JSON.stringify({ error: "Shopping list not found." });
    }
    active = match;
  }

  return JSON.stringify({
    needsConfirmation: true,
    added: false,
    listId: active.id,
    listName: active.name,
    items: sanitized.items,
    message:
      "Items are proposed only. The user must tap Add to list in the chat. Do not say you already added them.",
  });
}

export async function executeSousTool(
  userId: string,
  name: string,
  rawArgs: string
): Promise<string> {
  let args: Record<string, unknown> = {};
  try {
    const parsed = rawArgs.trim() ? JSON.parse(rawArgs) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return JSON.stringify({ error: "Tool arguments must be an object." });
    }
    args = parsed as Record<string, unknown>;
  } catch {
    return JSON.stringify({ error: "Tool arguments were not valid JSON." });
  }

  if (name === "search_recipes") {
    const query = typeof args.query === "string" ? args.query : "";
    return searchRecipes(userId, query);
  }
  if (name === "get_recipe_ingredients") {
    const recipeId = typeof args.recipe_id === "string" ? args.recipe_id : "";
    const servings = typeof args.servings === "number" ? args.servings : undefined;
    return getRecipeIngredients(userId, recipeId, servings);
  }
  if (name === "check_substitute") {
    const ingredient = typeof args.ingredient === "string" ? args.ingredient : "";
    return checkSubstitute(userId, ingredient);
  }
  if (name === "get_shopping_list") {
    const listId = typeof args.list_id === "string" ? args.list_id : undefined;
    return getShoppingList(userId, listId);
  }
  if (name === "add_to_shopping_list") {
    const listId = typeof args.list_id === "string" ? args.list_id : undefined;
    return proposeAddToShoppingList(userId, args.items, listId);
  }
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}
