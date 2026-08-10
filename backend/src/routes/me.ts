import { Router, Request } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { parseDietaryPreferences } from "../utils/dietaryPreferences.js";
import { validatePreferences } from "../utils/validation.js";

const router = Router();
type AuthRequest = Request & { userId?: string };

const PREFS_SELECT = {
  theme: true,
  defaultUnitCategory: true,
  dietaryPreferences: true,
} as const;

router.use(authMiddleware);

router.get("/preferences", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: PREFS_SELECT,
    });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({
      theme: user.theme,
      defaultUnitCategory: user.defaultUnitCategory,
      dietaryPreferences: parseDietaryPreferences(user.dietaryPreferences),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch preferences." });
  }
});

router.patch("/preferences", async (req: AuthRequest, res) => {
  try {
    const error = validatePreferences(req.body ?? {});
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const { theme, defaultUnitCategory, dietaryPreferences } = req.body as {
      theme?: string;
      defaultUnitCategory?: string;
      dietaryPreferences?: unknown;
    };

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...(theme != null && { theme }),
        ...(defaultUnitCategory != null && { defaultUnitCategory }),
        ...(dietaryPreferences != null && {
          dietaryPreferences: parseDietaryPreferences(dietaryPreferences),
        }),
      },
      select: PREFS_SELECT,
    });

    res.json({
      theme: user.theme,
      defaultUnitCategory: user.defaultUnitCategory,
      dietaryPreferences: parseDietaryPreferences(user.dietaryPreferences),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update preferences." });
  }
});

export { router as meRouter };
