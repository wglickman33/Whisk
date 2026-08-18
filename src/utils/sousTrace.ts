export const SOUS_TOOL_LABELS: Record<string, string> = {
  search_recipes: "Searching recipes",
  get_recipe_ingredients: "Reading ingredients",
  check_substitute: "Checking substitutes",
  get_shopping_list: "Reading shopping list",
  add_to_shopping_list: "Proposing list items",
};

export function sousToolLabel(name: string): string {
  return SOUS_TOOL_LABELS[name] ?? name.replaceAll("_", " ");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function itemNames(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const name = (item as { name?: unknown }).name;
      return typeof name === "string" ? name.trim() : "";
    })
    .filter(Boolean);
}

export function summarizeSousInput(name: string, input: unknown): string {
  const rec = asRecord(input);
  if (!rec) return "";
  if (name === "search_recipes" && typeof rec.query === "string") return rec.query.trim();
  if (name === "check_substitute" && typeof rec.ingredient === "string") {
    return rec.ingredient.trim();
  }
  if (name === "get_recipe_ingredients") return "Saved recipe";
  if (name === "add_to_shopping_list") {
    return itemNames(rec.items).slice(0, 3).join(", ");
  }
  return "";
}

export function summarizeSousOutput(name: string, output: unknown): string {
  const rec = asRecord(output);
  if (!rec) return "";
  if (typeof rec.error === "string" && rec.error.trim()) return rec.error.trim();

  if (name === "search_recipes") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    if (count <= 0) return "No matching recipes";
    return count === 1 ? "Found 1 recipe" : `Found ${count} recipes`;
  }

  if (name === "get_recipe_ingredients") {
    const title = typeof rec.title === "string" && rec.title.trim() ? rec.title.trim() : "Recipe";
    const count = Array.isArray(rec.ingredients) ? rec.ingredients.length : 0;
    return count === 1 ? `${title} · 1 ingredient` : `${title} · ${count} ingredients`;
  }

  if (name === "check_substitute") {
    if (rec.noSubstitute) return "No substitute found";
    const count = Array.isArray(rec.substitutes) ? rec.substitutes.length : 0;
    const ingredient =
      typeof rec.ingredient === "string" && rec.ingredient.trim()
        ? rec.ingredient.trim()
        : "ingredient";
    return count === 1 ? `1 option for ${ingredient}` : `${count} options for ${ingredient}`;
  }

  if (name === "get_shopping_list") {
    const list = asRecord(rec.list);
    const listName =
      typeof list?.name === "string" && list.name.trim() ? list.name.trim() : "Shopping list";
    const count = Array.isArray(list?.items) ? list.items.length : 0;
    return `${listName} · ${count} ${count === 1 ? "item" : "items"}`;
  }

  if (name === "add_to_shopping_list") {
    if (rec.needsConfirmation) {
      const listName =
        typeof rec.listName === "string" && rec.listName.trim()
          ? rec.listName.trim()
          : "your list";
      return `Waiting for you to confirm · ${listName}`;
    }
    return "Proposed items";
  }

  return "";
}

export type SousTraceStep = {
  id: string;
  name: string;
  input: unknown;
  output?: unknown;
  status: "running" | "done";
};

export function applySousTraceEvent(
  steps: SousTraceStep[],
  event: { type: string; id?: string; name?: string; input?: unknown; output?: unknown }
): SousTraceStep[] {
  if (event.type === "tool.start" && event.id && event.name) {
    const next: SousTraceStep = {
      id: event.id,
      name: event.name,
      input: event.input,
      status: "running",
    };
    const index = steps.findIndex((step) => step.id === event.id);
    if (index < 0) return [...steps, next];
    const copy = [...steps];
    copy[index] = next;
    return copy;
  }
  if (event.type === "tool.result" && event.id) {
    return steps.map((step) =>
      step.id === event.id ? { ...step, output: event.output, status: "done" } : step
    );
  }
  return steps;
}
