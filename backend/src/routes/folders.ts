import { Router, Request } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { isValidUuid, sanitizeString, LIMITS } from "../utils/validation.js";

const router = Router();
type AuthRequest = Request & { userId?: string };

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.userId! },
      orderBy: { name: "asc" },
      include: { _count: { select: { recipes: true } } },
    });
    res.json({
      folders: folders.map((f) => ({
        id: f.id,
        name: f.name,
        recipeCount: f._count.recipes,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch folders." });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const name = sanitizeString(req.body?.name, LIMITS.folderNameMax);
    if (!name) {
      res.status(400).json({ error: "Folder name is required." });
      return;
    }

    const folder = await prisma.folder.create({
      data: { userId: req.userId!, name },
    });
    res.status(201).json({ id: folder.id, name: folder.name, recipeCount: 0 });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      res.status(409).json({ error: "A folder with that name already exists." });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create folder." });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (!isValidUuid(id)) {
      res.status(400).json({ error: "Invalid folder id." });
      return;
    }

    const folder = await prisma.folder.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!folder) {
      res.status(404).json({ error: "Folder not found." });
      return;
    }

    await prisma.folder.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete folder." });
  }
});

export { router as foldersRouter };
