import crypto from "crypto";
import { LIMITS } from "./validation.js";

export function generateShareCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[crypto.randomInt(chars.length)];
  }
  return code;
}

export function normalizeJoinCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase().slice(0, 12);
  return code.length >= 6 ? code : null;
}

export function validateBulkCapacity(
  existingCount: number,
  newCount: number,
  max = LIMITS.shoppingListMaxItems
): string | null {
  if (newCount <= 0) return "At least one item is required.";
  if (existingCount + newCount > max) {
    return `Too many items (max ${max}).`;
  }
  return null;
}

export function hasItemPatchFields(body: Record<string, unknown>): boolean {
  return (
    body.name !== undefined ||
    body.category !== undefined ||
    body.quantity !== undefined ||
    body.note !== undefined ||
    body.checked !== undefined
  );
}
