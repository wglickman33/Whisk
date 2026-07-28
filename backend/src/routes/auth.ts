import { Router, Request } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { isEmailJsConfigured, sendEmailJsTemplate } from "../utils/emailjs.js";
import {
  isValidEmail,
  isValidPassword,
  sanitizeString,
  LIMITS,
} from "../utils/validation.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const SALT_ROUNDS = 10;
const RESET_TTL_MS = 60 * 60 * 1000;

function getFrontendOrigins(): string[] {
  return (process.env.FRONTEND_URL ?? "http://localhost:5173")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

/** Production reset links use the https origin; local dev uses localhost. */
function getResetLinkBase(): string {
  const origins = getFrontendOrigins();
  if (process.env.NODE_ENV === "production") {
    return origins.find((u) => u.startsWith("https://")) ?? origins[0] ?? "http://localhost:5173";
  }
  return origins.find((u) => /localhost|127\.0\.0\.1/.test(u)) ?? origins[0] ?? "http://localhost:5173";
}

function resetFrontendUrl(token: string, email: string): string {
  const base = getResetLinkBase();
  const params = new URLSearchParams({
    reset: "1",
    token,
    email,
  });
  return `${base}/?${params.toString()}`;
}

async function sendResetEmail(email: string, token: string, name?: string | null): Promise<void> {
  const resetUrl = resetFrontendUrl(token, email);
  const toName = name?.trim() || email.split("@")[0] || "there";

  if (isEmailJsConfigured()) {
    await sendEmailJsTemplate({
      to_email: email,
      to_name: toName,
      reset_link: resetUrl,
    });
    return;
  }

  if (process.env.NODE_ENV === "production") {
    console.error("[auth] Password reset email skipped: EmailJS is not configured.");
    return;
  }

  console.log(`[dev] Password reset link for ${email}: ${resetUrl}`);
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Valid email required" });
      return;
    }

    if (!isValidPassword(password)) {
      res.status(400).json({
        error: `Password must be ${LIMITS.passwordMin}-${LIMITS.passwordMax} characters.`,
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const safeName = name != null ? sanitizeString(name, LIMITS.nameMax) : null;

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: hashed, name: safeName },
      select: { id: true, email: true, name: true, theme: true, defaultUnitCategory: true, createdAt: true },
    });

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email) || typeof password !== "string" || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        theme: user.theme,
        defaultUnitCategory: user.defaultUnitCategory,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Valid email required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = await bcrypt.hash(rawToken, SALT_ROUNDS);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash,
          resetTokenExpires: new Date(Date.now() + RESET_TTL_MS),
        },
      });
      await sendResetEmail(normalizedEmail, rawToken, user.name);
    }

    res.json({ message: "If that email exists, a reset link was sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not process reset request." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, password } = req.body;

    if (!isValidEmail(email) || typeof token !== "string" || !token) {
      res.status(400).json({ error: "Email and token are required." });
      return;
    }
    if (!isValidPassword(password)) {
      res.status(400).json({
        error: `Password must be ${LIMITS.passwordMin}-${LIMITS.passwordMax} characters.`,
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user?.resetTokenHash || !user.resetTokenExpires) {
      res.status(400).json({ error: "Invalid or expired reset token." });
      return;
    }

    if (user.resetTokenExpires.getTime() < Date.now()) {
      res.status(400).json({ error: "Invalid or expired reset token." });
      return;
    }

    const valid = await bcrypt.compare(token, user.resetTokenHash);
    if (!valid) {
      res.status(400).json({ error: "Invalid or expired reset token." });
      return;
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetTokenHash: null,
        resetTokenExpires: null,
      },
    });

    res.json({ message: "Password updated. You can sign in now." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not reset password." });
  }
});

router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        theme: true,
        defaultUnitCategory: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export { router as authRouter };
