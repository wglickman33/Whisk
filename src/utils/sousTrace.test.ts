import { describe, it, expect } from "vitest";
import {
  sousToolLabel,
  summarizeSousInput,
  summarizeSousOutput,
  applySousTraceEvent,
} from "./sousTrace";

describe("sousTrace", () => {
  it("uses friendly tool labels", () => {
    expect(sousToolLabel("search_recipes")).toBe("Searching recipes");
    expect(sousToolLabel("unknown_tool")).toBe("unknown tool");
  });

  it("summarizes tool inputs", () => {
    expect(summarizeSousInput("search_recipes", { query: "chicken" })).toBe("chicken");
    expect(summarizeSousInput("check_substitute", { ingredient: "heavy cream" })).toBe(
      "heavy cream"
    );
    expect(
      summarizeSousInput("add_to_shopping_list", { items: [{ name: "coconut cream" }] })
    ).toBe("coconut cream");
  });

  it("summarizes tool outputs without dumping raw JSON", () => {
    expect(summarizeSousOutput("search_recipes", { count: 0, recipes: [] })).toBe(
      "No matching recipes"
    );
    expect(
      summarizeSousOutput("get_recipe_ingredients", {
        title: "Lemon Chicken",
        ingredients: [{ name: "chicken" }, { name: "lemon" }],
      })
    ).toBe("Lemon Chicken · 2 ingredients");
    expect(
      summarizeSousOutput("check_substitute", {
        ingredient: "heavy cream",
        substitutes: [{ text: "coconut cream" }],
        noSubstitute: false,
      })
    ).toBe("1 option for heavy cream");
    expect(
      summarizeSousOutput("add_to_shopping_list", {
        needsConfirmation: true,
        listName: "Groceries",
      })
    ).toBe("Waiting for you to confirm · Groceries");
    expect(summarizeSousOutput("search_recipes", { error: "Recipe not found." })).toBe(
      "Recipe not found."
    );
  });

  it("updates trace steps as tools start and finish", () => {
    const started = applySousTraceEvent([], {
      type: "tool.start",
      id: "call_1",
      name: "search_recipes",
      input: { query: "chicken" },
    });
    expect(started[0]).toMatchObject({ status: "running", name: "search_recipes" });
    const finished = applySousTraceEvent(started, {
      type: "tool.result",
      id: "call_1",
      output: { count: 1 },
    });
    expect(finished[0].status).toBe("done");
    expect(finished[0].output).toEqual({ count: 1 });
  });
});
