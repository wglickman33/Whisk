import { Router, Request } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import {
  isValidUuid,
  sanitizeString,
  validateRecipeBody,
  LIMITS,
} from "../utils/validation.js";
import { fetchAndScrapeRecipe } from "../utils/recipeScraper.js";
import { UrlSafetyError } from "../utils/urlSafety.js";

const router = Router();
type AuthRequest = Request & { userId?: string };

const recipeInclude = {
  ingredients: { orderBy: { order: "asc" as const } },
  steps: { orderBy: { order: "asc" as const } },
  tags: { include: { tag: true } },
  folder: { select: { id: true, name: true } },
};

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { userId: req.userId! },
      include: recipeInclude,
      orderBy: { updatedAt: "desc" },
    });
    res.json({ recipes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

router.post("/import-url", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
    if (!url || url.length > LIMITS.sourceUrlMax) {
      res.status(400).json({ error: "A valid URL is required." });
      return;
    }

    const scraped = await fetchAndScrapeRecipe(url);
    if (!scraped.title || scraped.ingredients.length === 0) {
      res.status(422).json({ error: "Could not extract a recipe from that page." });
      return;
    }

    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: scraped.title,
        description: scraped.description,
        servings: scraped.servings,
        sourceUrl: scraped.sourceUrl,
        ingredients: {
          create: scraped.ingredients.map((ing, i) => ({
            name: ing.name.slice(0, LIMITS.ingredientNameMax),
            quantity: ing.quantity,
            unit: ing.unit.slice(0, 50),
            notes: ing.notes,
            order: i,
          })),
        },
        steps: {
          create: scraped.steps.map((step, i) => ({
            instruction: step.instruction.slice(0, LIMITS.instructionMax),
            timerMinutes: step.timerMinutes,
            order: i,
          })),
        },
      },
      include: recipeInclude,
    });

    res.status(201).json(recipe);
  } catch (err) {
    if (err instanceof UrlSafetyError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Import failed." });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      res.status(400).json({ error: "Invalid recipe id" });
      return;
    }
    const recipe = await prisma.recipe.findFirst({
      where: { id, userId: req.userId! },
      include: recipeInclude,
    });
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }
    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const validationError = validateRecipeBody(req.body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const {
      title,
      description,
      type,
      servings,
      servingUnit,
      prepTime,
      cookTime,
      notes,
      sourceUrl,
      unitSystem,
      folderId,
      ingredients,
      steps,
    } = req.body;

    if (!title || typeof servings !== "number" || servings <= 0 || servings > 10000) {
      res.status(400).json({ error: "Title and valid servings are required" });
      return;
    }

    if (folderId != null && !isValidUuid(folderId)) {
      res.status(400).json({ error: "Invalid folder id." });
      return;
    }

    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
      if (!folder) {
        res.status(400).json({ error: "Folder not found." });
        return;
      }
    }

    const recipe = await prisma.recipe.create({
      data: {
        userId,
        folderId: folderId ?? null,
        title: sanitizeString(title, LIMITS.titleMax) ?? "Untitled",
        description: sanitizeString(description, LIMITS.descriptionMax),
        type: type ?? "food",
        servings: Number(servings),
        servingUnit: servingUnit ?? "servings",
        prepTime: prepTime != null ? Number(prepTime) : null,
        cookTime: cookTime != null ? Number(cookTime) : null,
        notes: sanitizeString(notes, LIMITS.notesMax),
        sourceUrl: sanitizeString(sourceUrl, LIMITS.sourceUrlMax),
        unitSystem: unitSystem ?? "inherit",
        ingredients: Array.isArray(ingredients)
          ? {
              create: ingredients.map(
                (
                  ing: {
                    name: string;
                    quantity?: number;
                    unit?: string;
                    notes?: string;
                    isOptional?: boolean;
                  },
                  i: number
                ) => ({
                  name: sanitizeString(ing.name, LIMITS.ingredientNameMax) ?? "",
                  quantity: typeof ing.quantity === "number" ? ing.quantity : 0,
                  unit: ing.unit != null ? String(ing.unit) : "",
                  notes: ing.notes != null ? String(ing.notes) : null,
                  isOptional: Boolean(ing.isOptional),
                  order: i,
                })
              ),
            }
          : undefined,
        steps: Array.isArray(steps)
          ? {
              create: steps.map(
                (step: { instruction: string; timerMinutes?: number }, i: number) => ({
                  instruction: sanitizeString(step.instruction, LIMITS.instructionMax) ?? "",
                  timerMinutes: step.timerMinutes != null ? Number(step.timerMinutes) : null,
                  order: i,
                })
              ),
            }
          : undefined,
      },
      include: recipeInclude,
    });
    res.status(201).json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create recipe" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    if (!isValidUuid(id)) {
      res.status(400).json({ error: "Invalid recipe id" });
      return;
    }
    const validationError = validateRecipeBody(req.body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    const existing = await prisma.recipe.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    const {
      title,
      description,
      type,
      servings,
      servingUnit,
      prepTime,
      cookTime,
      notes,
      sourceUrl,
      unitSystem,
      folderId,
      ingredients,
      steps,
    } = req.body;

    if (folderId !== undefined && folderId !== null && !isValidUuid(folderId)) {
      res.status(400).json({ error: "Invalid folder id." });
      return;
    }

    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
      if (!folder) {
        res.status(400).json({ error: "Folder not found." });
        return;
      }
    }

    await prisma.ingredient.deleteMany({ where: { recipeId: id } });
    await prisma.step.deleteMany({ where: { recipeId: id } });

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        ...(title != null && { title: sanitizeString(title, LIMITS.titleMax) ?? existing.title }),
        ...(description !== undefined && { description: sanitizeString(description, LIMITS.descriptionMax) }),
        ...(type != null && { type: String(type) }),
        ...(servings != null && { servings: Number(servings) }),
        ...(servingUnit != null && { servingUnit: String(servingUnit) }),
        ...(prepTime !== undefined && { prepTime: prepTime != null ? Number(prepTime) : null }),
        ...(cookTime !== undefined && { cookTime: cookTime != null ? Number(cookTime) : null }),
        ...(notes !== undefined && { notes: sanitizeString(notes, LIMITS.notesMax) }),
        ...(sourceUrl !== undefined && { sourceUrl: sanitizeString(sourceUrl, LIMITS.sourceUrlMax) }),
        ...(unitSystem != null && { unitSystem: String(unitSystem) }),
        ...(folderId !== undefined && { folderId }),
        ...(Array.isArray(ingredients) && {
          ingredients: {
            create: ingredients.map(
              (
                ing: {
                  name: string;
                  quantity?: number;
                  unit?: string;
                  notes?: string;
                  isOptional?: boolean;
                },
                i: number
              ) => ({
                name: sanitizeString(ing.name, LIMITS.ingredientNameMax) ?? "",
                quantity: typeof ing.quantity === "number" ? ing.quantity : 0,
                unit: ing.unit != null ? String(ing.unit).slice(0, 50) : "",
                notes: ing.notes != null ? sanitizeString(ing.notes, 200) : null,
                isOptional: Boolean(ing.isOptional),
                order: i,
              })
            ),
          },
        }),
        ...(Array.isArray(steps) && {
          steps: {
            create: steps.map(
              (step: { instruction: string; timerMinutes?: number }, i: number) => ({
                instruction: sanitizeString(step.instruction, LIMITS.instructionMax) ?? "",
                timerMinutes: step.timerMinutes != null ? Number(step.timerMinutes) : null,
                order: i,
              })
            ),
          },
        }),
      },
      include: recipeInclude,
    });
    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      res.status(400).json({ error: "Invalid recipe id" });
      return;
    }
    const existing = await prisma.recipe.findFirst({ where: { id, userId: req.userId! } });
    if (!existing) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }
    await prisma.recipe.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

export { router as recipesRouter };
