import { Router, Request } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { isValidUuid, sanitizeString, LIMITS } from "../utils/validation.js";

const router = Router();
type AuthRequest = Request & { userId?: string };

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { userId: req.userId! },
      orderBy: { label: "asc" },
    });
    res.json({ tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tags." });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const label = sanitizeString(req.body?.label, LIMITS.tagLabelMax);
    if (!label) {
      res.status(400).json({ error: "Tag label is required." });
      return;
    }

    const color = req.body?.color != null ? sanitizeString(String(req.body.color), 20) : null;

    const tag = await prisma.tag.create({
      data: { userId: req.userId!, label, color },
    });
    res.status(201).json(tag);
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      res.status(409).json({ error: "A tag with that label already exists." });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create tag." });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      res.status(400).json({ error: "Invalid tag id." });
      return;
    }

    const tag = await prisma.tag.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!tag) {
      res.status(404).json({ error: "Tag not found." });
      return;
    }

    await prisma.tag.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete tag." });
  }
});

router.put("/recipes/:recipeId", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { recipeId } = req.params;
    if (!isValidUuid(recipeId)) {
      res.status(400).json({ error: "Invalid recipe id." });
      return;
    }

    const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }

    const tagIds = req.body?.tagIds;
    if (!Array.isArray(tagIds)) {
      res.status(400).json({ error: "tagIds must be an array." });
      return;
    }

    for (const id of tagIds) {
      if (!isValidUuid(id)) {
        res.status(400).json({ error: "Invalid tag id in list." });
        return;
      }
    }

    const ownedTags = await prisma.tag.findMany({
      where: { userId, id: { in: tagIds } },
      select: { id: true },
    });
    if (ownedTags.length !== tagIds.length) {
      res.status(400).json({ error: "One or more tags were not found." });
      return;
    }

    await prisma.$transaction([
      prisma.recipeTag.deleteMany({ where: { recipeId } }),
      ...tagIds.map((tagId: string) =>
        prisma.recipeTag.create({ data: { recipeId, tagId } })
      ),
    ]);

    const tags = await prisma.tag.findMany({
      where: { recipes: { some: { recipeId } } },
    });
    res.json({ tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update recipe tags." });
  }
});

export { router as tagsRouter };
