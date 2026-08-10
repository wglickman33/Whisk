import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function jwtSecret(): string {
  return process.env.JWT_SECRET ?? "dev-secret-change-in-production";
}

export function verifyAccessToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, jwtSecret()) as { sub: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  const token = auth?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const userId = verifyAccessToken(token);
    if (!userId) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    (req as Request & { userId?: string }).userId = userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
