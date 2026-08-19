import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.js";
import { recipesRouter } from "./routes/recipes.js";
import { shoppingListsRouter } from "./routes/shoppingLists.js";
import { meRouter } from "./routes/me.js";
import { foldersRouter } from "./routes/folders.js";
import { tagsRouter } from "./routes/tags.js";
import { ingredientsRouter } from "./routes/ingredients.js";
import { sousRouter } from "./routes/sous.js";

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes(origin)) return true;
  if (
    process.env.NODE_ENV !== "production" &&
    /^https?:\/\/localhost(:\d+)?$/.test(origin)
  )
    return true;
  if (/^https:\/\/[\w-]+--[\w-]+\.netlify\.app$/.test(origin)) return true;
  return false;
}

export function createApp() {
  const app = express();

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((u) => u.trim()).filter(Boolean)
    : defaultOrigins;

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        cb(null, isAllowedOrigin(origin, allowedOrigins));
      },
      credentials: true,
    })
  );

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts. Try again later." },
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Try again later." },
  });

  const sousLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many chat requests. Try again in a minute." },
  });

  const importImageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many photo imports. Try again in a minute." },
  });

  app.use("/api/recipes/import-image", express.json({ limit: "8mb" }), importImageLimiter);
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/recipes", apiLimiter, recipesRouter);
  app.use("/api/shopping-lists", apiLimiter, shoppingListsRouter);
  app.use("/api/me", apiLimiter, meRouter);
  app.use("/api/folders", apiLimiter, foldersRouter);
  app.use("/api/tags", apiLimiter, tagsRouter);
  app.use("/api/ingredients", apiLimiter, ingredientsRouter);
  app.use("/api/sous", sousLimiter, sousRouter);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return app;
}
