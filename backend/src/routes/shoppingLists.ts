import { Router, Request } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import {
  isValidUuid,
  sanitizeString,
  LIMITS,
  validateShoppingListItemInput,
  validateBulkShoppingListItems,
} from "../utils/validation.js";
import {
  getListIfMember,
  getListWithMembers,
} from "../utils/shoppingListAccess.js";
import { serializeItem, serializeList } from "../utils/shoppingListSerialize.js";
import {
  generateShareCode,
  hasItemPatchFields,
  normalizeJoinCode,
  validateBulkCapacity,
} from "../utils/shoppingListLogic.js";

const router = Router();
type AuthRequest = Request & { userId?: string };

router.use(authMiddleware);

const memberUserSelect = {
  id: true,
  name: true,
  email: true,
} as const;

const listInclude = {
  owner: { select: memberUserSelect },
  members: { include: { user: { select: memberUserSelect } } },
} as const;

router.post("/join", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const code = normalizeJoinCode(req.body?.code);
    if (!code) {
      res.status(400).json({ error: "A valid share code is required." });
      return;
    }

    const list = await prisma.shoppingList.findUnique({
      where: { shareCode: code },
      include: listInclude,
    });

    if (!list) {
      res.status(404).json({ error: "No list found for that code." });
      return;
    }

    const alreadyMember =
      list.ownerUserId === userId || list.members.some((m) => m.userId === userId);

    if (!alreadyMember) {
      await prisma.shoppingListMember.create({
        data: { listId: list.id, userId },
      });
    }

    const refreshed = await prisma.shoppingList.findUniqueOrThrow({
      where: { id: list.id },
      include: listInclude,
    });

    res.json({ list: serializeList(refreshed, userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to join shopping list." });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const lists = await prisma.shoppingList.findMany({
      where: {
        OR: [{ ownerUserId: userId }, { members: { some: { userId } } }],
      },
      include: listInclude,
      orderBy: { createdAt: "asc" },
    });

    res.json({ lists: lists.map((list) => serializeList(list, userId)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shopping lists." });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const name =
      sanitizeString(req.body?.name, LIMITS.shoppingListNameMax) ?? "Shopping list";

    const list = await prisma.shoppingList.create({
      data: {
        name,
        ownerUserId: userId,
        members: { create: { userId } },
      },
      include: listInclude,
    });

    res.status(201).json({ list: serializeList(list, userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create shopping list." });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const listId = req.params.id;
    if (!isValidUuid(listId)) {
      res.status(400).json({ error: "Invalid list id." });
      return;
    }

    const list = await getListIfMember(listId, userId);
    if (!list) {
      res.status(404).json({ error: "Shopping list not found." });
      return;
    }

    const name = sanitizeString(req.body?.name, LIMITS.shoppingListNameMax);
    if (!name) {
      res.status(400).json({ error: "A valid list name is required." });
      return;
    }

    const updated = await prisma.shoppingList.update({
      where: { id: listId },
      data: { name },
      include: listInclude,
    });

    res.json({ list: serializeList(updated, userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update shopping list." });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const listId = req.params.id;
    if (!isValidUuid(listId)) {
      res.status(400).json({ error: "Invalid list id." });
      return;
    }

    const list = await prisma.shoppingList.findFirst({
      where: { id: listId, ownerUserId: userId },
    });
    if (!list) {
      res.status(404).json({ error: "Shopping list not found." });
      return;
    }

    await prisma.shoppingList.delete({ where: { id: listId } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete shopping list." });
  }
});

router.post("/:id/leave", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const listId = req.params.id;
    if (!isValidUuid(listId)) {
      res.status(400).json({ error: "Invalid list id." });
      return;
    }

    const list = await getListIfMember(listId, userId);
    if (!list) {
      res.status(404).json({ error: "Shopping list not found." });
      return;
    }

    if (list.ownerUserId === userId) {
      res.status(400).json({ error: "Owners cannot leave — delete the list instead." });
      return;
    }

    await prisma.shoppingListMember.deleteMany({
      where: { listId, userId },
    });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to leave shopping list." });
  }
});

router.get("/:id/items", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const listId = req.params.id;
    if (!isValidUuid(listId)) {
      res.status(400).json({ error: "Invalid list id." });
      return;
    }

    const list = await getListIfMember(listId, userId);
    if (!list) {
      res.status(404).json({ error: "Shopping list not found." });
      return;
    }

    const items = await prisma.shoppingListItem.findMany({
      where: { listId },
      include: { addedBy: { select: memberUserSelect } },
      orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
    });

    res.json({ items: items.map(serializeItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch list items." });
  }
});

router.post("/:id/items", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const listId = req.params.id;
    if (!isValidUuid(listId)) {
      res.status(400).json({ error: "Invalid list id." });
      return;
    }

    const list = await getListIfMember(listId, userId);
    if (!list) {
      res.status(404).json({ error: "Shopping list not found." });
      return;
    }

    const error = validateShoppingListItemInput(req.body);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const existingCount = await prisma.shoppingListItem.count({ where: { listId } });
    const capacityError = validateBulkCapacity(existingCount, 1);
    if (capacityError) {
      res.status(400).json({ error: capacityError });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const item = await prisma.shoppingListItem.create({
      data: {
        listId,
        name: sanitizeString(body.name, LIMITS.shoppingItemNameMax)!,
        category: sanitizeString(body.category, LIMITS.shoppingCategoryMax),
        quantity: sanitizeString(body.quantity, LIMITS.shoppingQuantityMax),
        note: sanitizeString(body.note, LIMITS.shoppingNoteMax),
        checked: false,
        addedByUserId: userId,
      },
      include: { addedBy: { select: memberUserSelect } },
    });

    res.status(201).json({ item: serializeItem(item) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add item." });
  }
});

router.post("/:id/items/bulk", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const listId = req.params.id;
    if (!isValidUuid(listId)) {
      res.status(400).json({ error: "Invalid list id." });
      return;
    }

    const list = await getListIfMember(listId, userId);
    if (!list) {
      res.status(404).json({ error: "Shopping list not found." });
      return;
    }

    const error = validateBulkShoppingListItems(req.body?.items);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const rows = req.body.items as Array<Record<string, unknown>>;
    const existingCount = await prisma.shoppingListItem.count({ where: { listId } });
    const capacityError = validateBulkCapacity(existingCount, rows.length);
    if (capacityError) {
      res.status(400).json({ error: capacityError });
      return;
    }

    await prisma.shoppingListItem.createMany({
      data: rows.map((row) => ({
        listId,
        name: sanitizeString(row.name, LIMITS.shoppingItemNameMax)!,
        category: sanitizeString(row.category, LIMITS.shoppingCategoryMax),
        quantity: sanitizeString(row.quantity, LIMITS.shoppingQuantityMax),
        note: sanitizeString(row.note, LIMITS.shoppingNoteMax),
        checked: false,
        addedByUserId: userId,
      })),
    });

    const items = await prisma.shoppingListItem.findMany({
      where: { listId },
      include: { addedBy: { select: memberUserSelect } },
      orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
    });

    res.status(201).json({ items: items.map(serializeItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add items." });
  }
});

router.patch("/:id/items/:itemId", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const listId = req.params.id;
    const itemId = req.params.itemId;
    if (!isValidUuid(listId) || !isValidUuid(itemId)) {
      res.status(400).json({ error: "Invalid id." });
      return;
    }

    const list = await getListIfMember(listId, userId);
    if (!list) {
      res.status(404).json({ error: "Shopping list not found." });
      return;
    }

    const existing = await prisma.shoppingListItem.findFirst({
      where: { id: itemId, listId },
    });
    if (!existing) {
      res.status(404).json({ error: "Item not found." });
      return;
    }

    const body = req.body as Record<string, unknown>;
    if (!hasItemPatchFields(body)) {
      res.status(400).json({ error: "No updates provided." });
      return;
    }

    const data: {
      name?: string;
      category?: string | null;
      quantity?: string | null;
      note?: string | null;
      checked?: boolean;
    } = {};

    if (body.name !== undefined) {
      const name = sanitizeString(body.name, LIMITS.shoppingItemNameMax);
      if (!name) {
        res.status(400).json({ error: "Item name cannot be empty." });
        return;
      }
      data.name = name;
    }
    if (body.category !== undefined) {
      data.category = sanitizeString(body.category, LIMITS.shoppingCategoryMax);
    }
    if (body.quantity !== undefined) {
      data.quantity = sanitizeString(body.quantity, LIMITS.shoppingQuantityMax);
    }
    if (body.note !== undefined) {
      data.note = sanitizeString(body.note, LIMITS.shoppingNoteMax);
    }
    if (body.checked !== undefined) {
      if (typeof body.checked !== "boolean") {
        res.status(400).json({ error: "Checked must be a boolean." });
        return;
      }
      data.checked = body.checked;
    }

    const item = await prisma.shoppingListItem.update({
      where: { id: itemId },
      data,
      include: { addedBy: { select: memberUserSelect } },
    });

    res.json({ item: serializeItem(item) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update item." });
  }
});

router.delete("/:id/items/checked", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const listId = req.params.id;
    if (!isValidUuid(listId)) {
      res.status(400).json({ error: "Invalid list id." });
      return;
    }

    const list = await getListIfMember(listId, userId);
    if (!list) {
      res.status(404).json({ error: "Shopping list not found." });
      return;
    }

    await prisma.shoppingListItem.deleteMany({
      where: { listId, checked: true },
    });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear checked items." });
  }
});

router.delete("/:id/items/:itemId", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const listId = req.params.id;
    const itemId = req.params.itemId;
    if (!isValidUuid(listId) || !isValidUuid(itemId)) {
      res.status(400).json({ error: "Invalid id." });
      return;
    }

    const list = await getListIfMember(listId, userId);
    if (!list) {
      res.status(404).json({ error: "Shopping list not found." });
      return;
    }

    const deleted = await prisma.shoppingListItem.deleteMany({
      where: { id: itemId, listId },
    });
    if (deleted.count === 0) {
      res.status(404).json({ error: "Item not found." });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete item." });
  }
});

router.post("/:id/share-code", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const listId = req.params.id;
    if (!isValidUuid(listId)) {
      res.status(400).json({ error: "Invalid list id." });
      return;
    }

    const list = await getListWithMembers(listId, userId);
    if (!list) {
      res.status(404).json({ error: "Shopping list not found." });
      return;
    }

    let shareCode = list.shareCode;
    if (!shareCode) {
      for (let attempt = 0; attempt < 5; attempt++) {
        shareCode = generateShareCode();
        try {
          await prisma.shoppingList.update({
            where: { id: listId },
            data: { shareCode },
          });
          break;
        } catch (err) {
          const code = (err as { code?: string }).code;
          if (code === "P2002") {
            shareCode = null;
            continue;
          }
          throw err;
        }
      }
      if (!shareCode) {
        res.status(500).json({ error: "Failed to generate share code." });
        return;
      }
    }

    res.json({ code: shareCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate share code." });
  }
});

export { router as shoppingListsRouter };
