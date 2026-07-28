import { Router, Request } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { validateShoppingListItems, sanitizeString, LIMITS } from "../utils/validation.js";

const router = Router();
type AuthRequest = Request & { userId?: string };

router.use(authMiddleware);

function serializeItem(item: {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  sourceRecipeId: string | null;
  sourceRecipeTitle: string | null;
  sortOrder: number;
}) {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    notes: item.notes,
    sourceRecipeId: item.sourceRecipeId ?? undefined,
    sourceRecipeTitle: item.sourceRecipeTitle ?? undefined,
  };
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const items = await prisma.shoppingListItem.findMany({
      where: { userId: req.userId! },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    res.json({ items: items.map(serializeItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shopping list." });
  }
});

router.put("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const error = validateShoppingListItems(req.body?.items);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const items = req.body.items as Array<Record<string, unknown>>;

    await prisma.$transaction(async (tx) => {
      await tx.shoppingListItem.deleteMany({ where: { userId } });
      if (items.length === 0) return;

      await tx.shoppingListItem.createMany({
        data: items.map((row, index) => ({
          userId,
          name: sanitizeString(row.name, LIMITS.shoppingItemNameMax) ?? "Item",
          quantity: typeof row.quantity === "number" ? row.quantity : 1,
          unit: sanitizeString(row.unit, 50) ?? "",
          notes: row.notes != null ? sanitizeString(String(row.notes), 500) : null,
          sourceRecipeId:
            typeof row.sourceRecipeId === "string" ? row.sourceRecipeId.slice(0, 36) : null,
          sourceRecipeTitle:
            typeof row.sourceRecipeTitle === "string"
              ? sanitizeString(row.sourceRecipeTitle, LIMITS.titleMax)
              : null,
          sortOrder: index,
        })),
      });
    });

    const saved = await prisma.shoppingListItem.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    res.json({ items: saved.map(serializeItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save shopping list." });
  }
});

export { router as shoppingListRouter };
