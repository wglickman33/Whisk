import { Router, Request } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  mapDietaryPreferencesToSpoonacular,
  parseDietaryPreferencesFromQuery,
} from "../utils/dietaryPreferences.js";
import { fetchSpoonacularSubstitutes } from "../utils/spoonacularSubstitutes.js";

const router = Router();
type AuthRequest = Request & { userId?: string };

router.use(authMiddleware);

router.get("/substitutes", async (req: AuthRequest, res) => {
  const rawName = typeof req.query.name === "string" ? req.query.name.trim() : "";
  if (!rawName || rawName.length > 200) {
    res.status(400).json({ error: "A valid ingredient name is required." });
    return;
  }

  const apiKey = process.env.SPOONACULAR_API_KEY?.trim();
  if (!apiKey) {
    res.json({ substitutes: [] });
    return;
  }

  const prefs = parseDietaryPreferencesFromQuery(req.query as Record<string, unknown>);
  const { intolerances, diet } = mapDietaryPreferencesToSpoonacular(prefs);

  const substitutes = await fetchSpoonacularSubstitutes(rawName, {
    apiKey,
    intolerances,
    diet,
  });
  res.json({ substitutes });
});

export { router as ingredientsRouter };
