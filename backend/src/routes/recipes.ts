import { Router, Request } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

type AuthRequest = Request & { userId?: string };

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const recipes = await prisma.recipe.findMany({
      where: { userId },
      include: {
        ingredients: { orderBy: { order: "asc" } },
        steps: { orderBy: { order: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ recipes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const recipe = await prisma.recipe.findFirst({
      where: { id, userId },
      include: {
        ingredients: { orderBy: { order: "asc" } },
        steps: { orderBy: { order: "asc" } },
      },
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
      ingredients,
      steps,
    } = req.body;

    if (!title || typeof servings !== "number") {
      res.status(400).json({ error: "Title and servings are required" });
      return;
    }

    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: String(title),
        description: description != null ? String(description) : null,
        type: type ?? "food",
        servings: Number(servings),
        servingUnit: servingUnit ?? "servings",
        prepTime: prepTime != null ? Number(prepTime) : null,
        cookTime: cookTime != null ? Number(cookTime) : null,
        notes: notes != null ? String(notes) : null,
        sourceUrl: sourceUrl != null ? String(sourceUrl) : null,
        unitSystem: unitSystem ?? "inherit",
        ingredients: Array.isArray(ingredients)
          ? {
              create: ingredients.map((ing: { name: string; quantity?: number; unit?: string; notes?: string; isOptional?: boolean }, i: number) => ({
                name: String(ing.name),
                quantity: typeof ing.quantity === "number" ? ing.quantity : 0,
                unit: ing.unit != null ? String(ing.unit) : "",
                notes: ing.notes != null ? String(ing.notes) : null,
                isOptional: Boolean(ing.isOptional),
                order: i,
              })),
            }
          : undefined,
        steps: Array.isArray(steps)
          ? {
              create: steps.map((step: { instruction: string; timerMinutes?: number }, i: number) => ({
                instruction: String(step.instruction),
                timerMinutes: step.timerMinutes != null ? Number(step.timerMinutes) : null,
                order: i,
              })),
            }
          : undefined,
      },
      include: {
        ingredients: { orderBy: { order: "asc" } },
        steps: { orderBy: { order: "asc" } },
      },
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
      ingredients,
      steps,
    } = req.body;

    await prisma.ingredient.deleteMany({ where: { recipeId: id } });
    await prisma.step.deleteMany({ where: { recipeId: id } });

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        ...(title != null && { title: String(title) }),
        ...(description !== undefined && { description: description != null ? String(description) : null }),
        ...(type != null && { type: String(type) }),
        ...(servings != null && { servings: Number(servings) }),
        ...(servingUnit != null && { servingUnit: String(servingUnit) }),
        ...(prepTime !== undefined && { prepTime: prepTime != null ? Number(prepTime) : null }),
        ...(cookTime !== undefined && { cookTime: cookTime != null ? Number(cookTime) : null }),
        ...(notes !== undefined && { notes: notes != null ? String(notes) : null }),
        ...(sourceUrl !== undefined && { sourceUrl: sourceUrl != null ? String(sourceUrl) : null }),
        ...(unitSystem != null && { unitSystem: String(unitSystem) }),
        ...(Array.isArray(ingredients) && {
          ingredients: {
            create: ingredients.map((ing: { name: string; quantity?: number; unit?: string; notes?: string; isOptional?: boolean }, i: number) => ({
              name: String(ing.name),
              quantity: typeof ing.quantity === "number" ? ing.quantity : 0,
              unit: ing.unit != null ? String(ing.unit) : "",
              notes: ing.notes != null ? String(ing.notes) : null,
              isOptional: Boolean(ing.isOptional),
              order: i,
            })),
          },
        }),
        ...(Array.isArray(steps) && {
          steps: {
            create: steps.map((step: { instruction: string; timerMinutes?: number }, i: number) => ({
              instruction: String(step.instruction),
              timerMinutes: step.timerMinutes != null ? Number(step.timerMinutes) : null,
              order: i,
            })),
          },
        }),
      },
      include: {
        ingredients: { orderBy: { order: "asc" } },
        steps: { orderBy: { order: "asc" } },
      },
    });
    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const existing = await prisma.recipe.findFirst({ where: { id, userId } });
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
