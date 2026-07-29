import type { Recipe, RecipeInput } from "../api/client";
import { foldersApi, recipesApi, tagsApi } from "../api/client";
import { formatQuantity } from "./formatQuantity";
import { createRecipePdf, recipePdfFilename } from "./recipePdf";

export const WHISK_RECIPE_FORMAT = "whisk-recipe" as const;
export const WHISK_RECIPE_VERSION = 1 as const;

/** Mirrors backend recipe limits so imports fail early with clear errors. */
const WHISK_LIMITS = {
  titleMax: 200,
  descriptionMax: 5000,
  instructionMax: 4000,
  ingredientNameMax: 200,
  maxIngredients: 100,
  maxSteps: 100,
  notesMax: 5000,
  sourceUrlMax: 2048,
  tagLabelMax: 50,
  folderNameMax: 100,
  maxServings: 10000,
} as const;

export interface WhiskRecipePayload {
  title: string;
  description?: string | null;
  type?: string;
  servings: number;
  servingUnit?: string;
  prepTime?: number | null;
  cookTime?: number | null;
  notes?: string | null;
  sourceUrl?: string | null;
  unitSystem?: string;
  folderName?: string | null;
  tagLabels?: string[];
  ingredients: {
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string | null;
    isOptional?: boolean;
  }[];
  steps: {
    instruction: string;
    timerMinutes?: number | null;
    imageUrl?: string | null;
  }[];
}

export interface WhiskRecipeFile {
  format: typeof WHISK_RECIPE_FORMAT;
  version: typeof WHISK_RECIPE_VERSION;
  exportedAt: string;
  recipe: WhiskRecipePayload;
}

function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "recipe";
}

export function recipeToWhiskFile(recipe: Recipe): WhiskRecipeFile {
  const ingredients = [...recipe.ingredients]
    .sort((a, b) => a.order - b.order)
    .map(({ name, quantity, unit, notes, isOptional }) => ({
      name,
      quantity,
      unit,
      notes,
      isOptional,
    }));

  const steps = [...recipe.steps]
    .sort((a, b) => a.order - b.order)
    .map(({ instruction, timerMinutes, imageUrl }) => ({
      instruction,
      timerMinutes,
      imageUrl,
    }));

  return {
    format: WHISK_RECIPE_FORMAT,
    version: WHISK_RECIPE_VERSION,
    exportedAt: new Date().toISOString(),
    recipe: {
      title: recipe.title,
      description: recipe.description,
      type: recipe.type,
      servings: recipe.servings,
      servingUnit: recipe.servingUnit,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      notes: recipe.notes,
      sourceUrl: recipe.sourceUrl,
      unitSystem: recipe.unitSystem,
      folderName: recipe.folder?.name ?? null,
      tagLabels: recipe.tags?.map(({ tag }) => tag.label) ?? [],
      ingredients,
      steps,
    },
  };
}

function validateWhiskRecipePayload(recipe: WhiskRecipePayload): void {
  if (!recipe.title?.trim()) {
    throw new Error("Recipe file is missing a title.");
  }
  if (recipe.title.length > WHISK_LIMITS.titleMax) {
    throw new Error(`Recipe title exceeds ${WHISK_LIMITS.titleMax} characters.`);
  }
  if (typeof recipe.servings !== "number" || !Number.isFinite(recipe.servings)) {
    throw new Error("Recipe file has invalid servings.");
  }
  if (recipe.servings <= 0 || recipe.servings > WHISK_LIMITS.maxServings) {
    throw new Error(`Servings must be between 1 and ${WHISK_LIMITS.maxServings}.`);
  }
  if (!Array.isArray(recipe.ingredients)) {
    throw new Error("Recipe file ingredients must be an array.");
  }
  if (!Array.isArray(recipe.steps)) {
    throw new Error("Recipe file steps must be an array.");
  }
  if (recipe.ingredients.length > WHISK_LIMITS.maxIngredients) {
    throw new Error(`Too many ingredients (max ${WHISK_LIMITS.maxIngredients}).`);
  }
  if (recipe.steps.length > WHISK_LIMITS.maxSteps) {
    throw new Error(`Too many steps (max ${WHISK_LIMITS.maxSteps}).`);
  }

  for (const [index, ing] of recipe.ingredients.entries()) {
    if (!ing || typeof ing !== "object") {
      throw new Error(`Ingredient ${index + 1} is invalid.`);
    }
    if (typeof ing.name !== "string" || !ing.name.trim()) {
      throw new Error(`Ingredient ${index + 1} is missing a name.`);
    }
    if (ing.name.length > WHISK_LIMITS.ingredientNameMax) {
      throw new Error(`Ingredient ${index + 1} name is too long.`);
    }
    if (ing.quantity != null && (typeof ing.quantity !== "number" || !Number.isFinite(ing.quantity))) {
      throw new Error(`Ingredient ${index + 1} has invalid quantity.`);
    }
  }

  for (const [index, step] of recipe.steps.entries()) {
    if (!step || typeof step !== "object") {
      throw new Error(`Step ${index + 1} is invalid.`);
    }
    if (typeof step.instruction !== "string" || !step.instruction.trim()) {
      throw new Error(`Step ${index + 1} is missing instruction text.`);
    }
    if (step.instruction.length > WHISK_LIMITS.instructionMax) {
      throw new Error(`Step ${index + 1} instruction is too long.`);
    }
    if (
      step.timerMinutes != null &&
      (typeof step.timerMinutes !== "number" || !Number.isFinite(step.timerMinutes))
    ) {
      throw new Error(`Step ${index + 1} has invalid timer minutes.`);
    }
  }

  if (Array.isArray(recipe.tagLabels)) {
    for (const label of recipe.tagLabels) {
      if (typeof label !== "string" || !label.trim()) {
        throw new Error("Recipe file has an invalid tag label.");
      }
      if (label.length > WHISK_LIMITS.tagLabelMax) {
        throw new Error(`Tag label "${label}" is too long.`);
      }
    }
  }

  if (recipe.folderName != null) {
    if (typeof recipe.folderName !== "string" || !recipe.folderName.trim()) {
      throw new Error("Recipe file has an invalid folder name.");
    }
    if (recipe.folderName.length > WHISK_LIMITS.folderNameMax) {
      throw new Error("Recipe folder name is too long.");
    }
  }
}

export function whiskFileToRecipeInput(file: WhiskRecipeFile): RecipeInput {
  validateWhiskRecipePayload(file.recipe);
  const { recipe } = file;

  return {
    title: recipe.title.trim(),
    description: recipe.description ?? null,
    type: recipe.type ?? "food",
    servings: recipe.servings,
    servingUnit: recipe.servingUnit?.trim() || "servings",
    prepTime: recipe.prepTime ?? null,
    cookTime: recipe.cookTime ?? null,
    notes: recipe.notes ?? null,
    sourceUrl: recipe.sourceUrl ?? null,
    unitSystem: recipe.unitSystem ?? "inherit",
    ingredients: recipe.ingredients.map((ing) => ({
      name: ing.name.trim(),
      quantity: typeof ing.quantity === "number" ? ing.quantity : 0,
      unit: ing.unit?.trim() ?? "",
      notes: ing.notes ?? null,
      isOptional: Boolean(ing.isOptional),
    })),
    steps: recipe.steps.map((step) => ({
      instruction: step.instruction.trim(),
      timerMinutes: step.timerMinutes ?? null,
      imageUrl: step.imageUrl ?? null,
    })),
  };
}

export function parseWhiskRecipeFile(raw: unknown): WhiskRecipeFile {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid recipe file.");
  }
  const file = raw as Partial<WhiskRecipeFile>;
  if (file.format !== WHISK_RECIPE_FORMAT) {
    throw new Error("This file is not a Whisk recipe export.");
  }
  if (file.version !== WHISK_RECIPE_VERSION) {
    throw new Error(`Unsupported recipe file version (${String(file.version)}).`);
  }
  if (!file.recipe || typeof file.recipe !== "object") {
    throw new Error("Recipe file is missing recipe data.");
  }
  validateWhiskRecipePayload(file.recipe as WhiskRecipePayload);
  return file as WhiskRecipeFile;
}

function formatIngredientLine(ing: {
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  isOptional: boolean;
}): string {
  const parts: string[] = [];
  if (ing.quantity > 0) parts.push(formatQuantity(ing.quantity));
  if (ing.unit.trim()) parts.push(ing.unit.trim());
  parts.push(ing.name.trim());
  let line = parts.join(" ");
  if (ing.notes?.trim()) line += ` (${ing.notes.trim()})`;
  if (ing.isOptional) line += " — optional";
  return line;
}

export function recipeToPlainText(recipe: Recipe): string {
  const divider = "══════════════════════════════════════";
  const section = "──────────────────────────────────────";
  const lines: string[] = [
    recipe.title.trim().toUpperCase(),
    divider,
    "",
  ];

  if (recipe.description?.trim()) {
    lines.push(recipe.description.trim(), "");
  }

  const meta: string[] = [];
  if (recipe.prepTime != null) meta.push(`Prep: ${recipe.prepTime} min`);
  if (recipe.cookTime != null) meta.push(`Cook: ${recipe.cookTime} min`);
  const servingUnit = recipe.servingUnit.trim();
  if (!servingUnit || servingUnit.toLowerCase() === "servings") {
    meta.push(`${recipe.servings} serving${recipe.servings === 1 ? "" : "s"}`);
  } else {
    meta.push(`${recipe.servings} ${servingUnit}`);
  }
  lines.push(meta.join("    "), "");

  if (recipe.tags && recipe.tags.length > 0) {
    lines.push(`Tags: ${recipe.tags.map(({ tag }) => tag.label).join(", ")}`, "");
  }

  lines.push("INGREDIENTS", section);
  for (const ing of [...recipe.ingredients].sort((a, b) => a.order - b.order)) {
    lines.push(`  • ${formatIngredientLine(ing)}`);
  }
  lines.push("");

  lines.push("INSTRUCTIONS", section);
  for (const [index, step] of [...recipe.steps]
    .sort((a, b) => a.order - b.order)
    .entries()) {
    const timer =
      step.timerMinutes != null && step.timerMinutes > 0
        ? ` (${step.timerMinutes} min)`
        : "";
    lines.push(`  ${index + 1}. ${step.instruction.trim()}${timer}`);
    lines.push("");
  }

  if (recipe.notes?.trim()) {
    lines.push("NOTES", section, `  ${recipe.notes.trim()}`, "");
  }

  if (recipe.sourceUrl?.trim()) {
    lines.push(`Source: ${recipe.sourceUrl.trim()}`, "");
  }

  lines.push(divider, "Exported from Whisk");
  return lines.join("\n");
}

export function downloadJsonFile(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadWhiskRecipeFile(recipe: Recipe): void {
  const file = recipeToWhiskFile(recipe);
  downloadJsonFile(`${slugify(recipe.title)}.whisk.json`, file);
}

export function downloadRecipePlainText(recipe: Recipe): void {
  downloadTextFile(`${slugify(recipe.title)}.txt`, recipeToPlainText(recipe));
}

export async function downloadRecipePdf(recipe: Recipe): Promise<void> {
  const bytes = await createRecipePdf(recipe);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = recipePdfFilename(recipe);
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readRecipeFile(
  file: File
): Promise<{ input: RecipeInput; tagLabels: string[]; folderName: string | null }> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Recipe file must be valid JSON.");
  }
  const whiskFile = parseWhiskRecipeFile(parsed);
  return {
    input: whiskFileToRecipeInput(whiskFile),
    tagLabels: whiskFile.recipe.tagLabels ?? [],
    folderName: whiskFile.recipe.folderName?.trim() || null,
  };
}

async function resolveFolderId(name: string | null): Promise<string | null> {
  if (!name) return null;
  const { folders } = await foldersApi.list();
  const existing = folders.find((folder) => folder.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.id;
  const created = await foldersApi.create(name);
  return created.id;
}

async function resolveTagIds(labels: string[]): Promise<string[]> {
  if (labels.length === 0) return [];
  const { tags } = await tagsApi.list();
  const byLabel = new Map(tags.map((tag) => [tag.label.toLowerCase(), tag]));
  const ids: string[] = [];

  for (const raw of labels) {
    const label = raw.trim();
    if (!label) continue;
    const existing = byLabel.get(label.toLowerCase());
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const created = await tagsApi.create(label);
    byLabel.set(label.toLowerCase(), created);
    ids.push(created.id);
  }

  return ids;
}

/** Import a Whisk recipe file and recreate tags/folders from exported labels. */
export async function importRecipeFromFile(file: File): Promise<Recipe> {
  const { input, tagLabels, folderName } = await readRecipeFile(file);
  const folderId = await resolveFolderId(folderName);
  const recipe = await recipesApi.create({ ...input, folderId });
  const tagIds = await resolveTagIds(tagLabels);
  if (tagIds.length === 0) return recipe;

  const { tags } = await tagsApi.setRecipeTags(recipe.id, tagIds);
  return {
    ...recipe,
    tags: tags.map((tag) => ({ tag })),
  };
}
