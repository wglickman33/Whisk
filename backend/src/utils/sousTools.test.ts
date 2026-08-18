import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const findFirst = vi.fn();
const findUnique = vi.fn();
const shoppingListFindMany = vi.fn();
const shoppingListItemCreateMany = vi.fn();
const fetchSpoonacularSubstitutes = vi.fn();

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    recipe: {
      findMany: (...args: unknown[]) => findMany(...args),
      findFirst: (...args: unknown[]) => findFirst(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
    shoppingList: {
      findMany: (...args: unknown[]) => shoppingListFindMany(...args),
    },
    shoppingListItem: {
      createMany: (...args: unknown[]) => shoppingListItemCreateMany(...args),
    },
  },
}));

vi.mock("./spoonacularSubstitutes.js", () => ({
  fetchSpoonacularSubstitutes: (...args: unknown[]) => fetchSpoonacularSubstitutes(...args),
}));

const {
  searchRecipes,
  getRecipeIngredients,
  checkSubstitute,
  getShoppingList,
  proposeAddToShoppingList,
  executeSousTool,
  parseSousPendingAction,
} = await import("./sousTools.js");

const RECIPE_ID = "550e8400-e29b-41d4-a716-446655440000";
const USER_ID = "11111111-1111-1111-1111-111111111111";
const LIST_ID = "770e8400-e29b-41d4-a716-446655440000";

describe("sousTools", () => {
  beforeEach(() => {
    findMany.mockReset();
    findFirst.mockReset();
    findUnique.mockReset();
    shoppingListFindMany.mockReset();
    shoppingListItemCreateMany.mockReset();
    fetchSpoonacularSubstitutes.mockReset();
    delete process.env.SPOONACULAR_API_KEY;
  });

  it("search_recipes matches title, ingredient, and tag and scopes to the user", async () => {
    findMany.mockResolvedValue([
      {
        id: RECIPE_ID,
        title: "Lemon Chicken",
        description: "Weeknight roast",
        servings: 4,
        servingUnit: "servings",
        ingredients: [{ name: "chicken thighs" }],
        tags: [{ tag: { label: "dinner" } }],
      },
      {
        id: "660e8400-e29b-41d4-a716-446655440000",
        title: "Tomato Soup",
        description: null,
        servings: 2,
        servingUnit: "servings",
        ingredients: [{ name: "tomato" }],
        tags: [],
      },
    ]);

    const result = JSON.parse(await searchRecipes(USER_ID, "chicken"));
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } })
    );
    expect(result.count).toBe(1);
    expect(result.recipes[0].title).toBe("Lemon Chicken");
    expect(result.recipes[0].id).toBe(RECIPE_ID);
  });

  it("search_recipes returns an empty list when nothing matches", async () => {
    findMany.mockResolvedValue([
      {
        id: RECIPE_ID,
        title: "Salad",
        description: null,
        servings: 2,
        servingUnit: "servings",
        ingredients: [],
        tags: [],
      },
    ]);
    const result = JSON.parse(await searchRecipes(USER_ID, "lasagna"));
    expect(result).toEqual({ query: "lasagna", count: 0, recipes: [] });
  });

  it("get_recipe_ingredients scales quantities and rejects other users' recipes", async () => {
    findFirst.mockResolvedValue({
      id: RECIPE_ID,
      title: "Pancakes",
      servings: 4,
      servingUnit: "servings",
      ingredients: [
        { name: "flour", quantity: 2, unit: "cups", notes: null, isOptional: false },
        { name: "milk", quantity: 1, unit: "cup", notes: "whole", isOptional: false },
      ],
    });

    const scaled = JSON.parse(await getRecipeIngredients(USER_ID, RECIPE_ID, 8));
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: RECIPE_ID, userId: USER_ID } })
    );
    expect(scaled.servings).toBe(8);
    expect(scaled.ingredients[0].quantity).toBe(4);
    expect(scaled.ingredients[1].quantity).toBe(2);

    findFirst.mockResolvedValue(null);
    expect(JSON.parse(await getRecipeIngredients(USER_ID, RECIPE_ID))).toEqual({
      error: "Recipe not found.",
    });
  });

  it("check_substitute reuses fallback data when Spoonacular is empty", async () => {
    findUnique.mockResolvedValue({ dietaryPreferences: {} });
    fetchSpoonacularSubstitutes.mockResolvedValue([]);

    const result = JSON.parse(await checkSubstitute(USER_ID, "heavy cream"));
    expect(result.ingredient).toBe("heavy cream");
    expect(result.source).toBe("fallback");
    expect(result.noSubstitute).toBe(false);
    expect(result.substitutes.map((s: { text: string }) => s.text)).toContain(
      "full-fat coconut cream (1:1, for cooking)"
    );
  });

  it("check_substitute prefers Spoonacular results when present", async () => {
    process.env.SPOONACULAR_API_KEY = "spoon-key";
    findUnique.mockResolvedValue({ dietaryPreferences: {} });
    fetchSpoonacularSubstitutes.mockResolvedValue(["oat milk"]);

    const result = JSON.parse(await checkSubstitute(USER_ID, "milk"));
    expect(result.source).toBe("api");
    expect(result.substitutes).toEqual([{ text: "oat milk" }]);
    expect(fetchSpoonacularSubstitutes).toHaveBeenCalled();
  });

  it("check_substitute returns none for an unknown ingredient", async () => {
    findUnique.mockResolvedValue({ dietaryPreferences: {} });
    const result = JSON.parse(await checkSubstitute(USER_ID, "unicorn dust"));
    expect(result).toMatchObject({ source: "none", noSubstitute: true, substitutes: [] });
  });

  it("get_shopping_list returns the user's list items", async () => {
    shoppingListFindMany.mockResolvedValue([
      {
        id: LIST_ID,
        name: "Groceries",
        items: [
          {
            id: "item-1",
            name: "Garlic",
            category: "Produce",
            quantity: "1 head",
            note: null,
            checked: false,
          },
        ],
      },
    ]);

    const result = JSON.parse(await getShoppingList(USER_ID));
    expect(result.list.name).toBe("Groceries");
    expect(result.list.items[0].name).toBe("Garlic");
    expect(result.lists).toEqual([{ id: LIST_ID, name: "Groceries", itemCount: 1 }]);
  });

  it("add_to_shopping_list proposes items and never writes", async () => {
    shoppingListFindMany.mockResolvedValue([
      { id: LIST_ID, name: "Groceries", items: [] },
    ]);

    const result = JSON.parse(
      await proposeAddToShoppingList(USER_ID, [{ name: "coconut milk", quantity: "1 can" }])
    );
    expect(result.needsConfirmation).toBe(true);
    expect(result.added).toBe(false);
    expect(result.listId).toBe(LIST_ID);
    expect(result.items[0].name).toBe("coconut milk");
    expect(shoppingListItemCreateMany).not.toHaveBeenCalled();

    const pending = parseSousPendingAction("add_to_shopping_list", JSON.stringify(result));
    expect(pending).toEqual({
      type: "add_to_shopping_list",
      listId: LIST_ID,
      listName: "Groceries",
      items: [
        { name: "coconut milk", quantity: "1 can", category: null, note: null },
      ],
    });
  });

  it("executeSousTool rejects unknown tools and bad JSON", async () => {
    expect(JSON.parse(await executeSousTool(USER_ID, "explode", "{}"))).toEqual({
      error: "Unknown tool: explode",
    });
    expect(JSON.parse(await executeSousTool(USER_ID, "search_recipes", "{"))).toEqual({
      error: "Tool arguments were not valid JSON.",
    });
  });

  it("executeSousTool routes check_substitute and shopping list tools", async () => {
    findUnique.mockResolvedValue({ dietaryPreferences: {} });
    shoppingListFindMany.mockResolvedValue([
      { id: LIST_ID, name: "Groceries", items: [] },
    ]);

    const sub = JSON.parse(
      await executeSousTool(USER_ID, "check_substitute", '{"ingredient":"heavy cream"}')
    );
    expect(sub.source).toBe("fallback");

    const list = JSON.parse(await executeSousTool(USER_ID, "get_shopping_list", "{}"));
    expect(list.list.id).toBe(LIST_ID);

    const proposed = JSON.parse(
      await executeSousTool(
        USER_ID,
        "add_to_shopping_list",
        JSON.stringify({ items: [{ name: "butter" }] })
      )
    );
    expect(proposed.needsConfirmation).toBe(true);
    expect(shoppingListItemCreateMany).not.toHaveBeenCalled();
  });
});
