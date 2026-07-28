const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const LIMITS = {
  emailMax: 254,
  passwordMin: 8,
  passwordMax: 128,
  nameMax: 100,
  titleMax: 200,
  descriptionMax: 5000,
  instructionMax: 4000,
  ingredientNameMax: 200,
  maxIngredients: 100,
  maxSteps: 100,
  notesMax: 5000,
  sourceUrlMax: 2048,
  shoppingListMaxItems: 500,
  shoppingItemNameMax: 200,
  folderNameMax: 100,
  tagLabelMax: 50,
} as const;

const THEMES = new Set(["light", "dark"]);
const UNIT_CATEGORIES = new Set([
  "volume", "weight", "length", "area", "time",
  "speed", "pressure", "energy", "data", "temp",
]);

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" &&
    email.length <= LIMITS.emailMax &&
    EMAIL_RE.test(email.trim());
}

export function isValidPassword(password: unknown): password is string {
  return typeof password === "string" &&
    password.length >= LIMITS.passwordMin &&
    password.length <= LIMITS.passwordMax;
}

export function isValidUuid(id: unknown): id is string {
  return typeof id === "string" && UUID_RE.test(id);
}

export function sanitizeString(value: unknown, maxLen: number): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return String(value).slice(0, maxLen);
  return value.trim().slice(0, maxLen);
}

export function validateRecipeBody(body: Record<string, unknown>): string | null {
  if (body.title != null && typeof body.title === "string" && body.title.length > LIMITS.titleMax) {
    return `Title must be at most ${LIMITS.titleMax} characters.`;
  }
  if (Array.isArray(body.ingredients) && body.ingredients.length > LIMITS.maxIngredients) {
    return `Too many ingredients (max ${LIMITS.maxIngredients}).`;
  }
  if (Array.isArray(body.steps) && body.steps.length > LIMITS.maxSteps) {
    return `Too many steps (max ${LIMITS.maxSteps}).`;
  }
  if (body.sourceUrl != null && typeof body.sourceUrl === "string" && body.sourceUrl.length > LIMITS.sourceUrlMax) {
    return "Source URL is too long.";
  }
  return null;
}

export function validateShoppingListItems(items: unknown): string | null {
  if (!Array.isArray(items)) return "Items must be an array.";
  if (items.length > LIMITS.shoppingListMaxItems) {
    return `Too many items (max ${LIMITS.shoppingListMaxItems}).`;
  }
  for (const item of items) {
    if (!item || typeof item !== "object") return "Each item must be an object.";
    const row = item as Record<string, unknown>;
    if (typeof row.name !== "string" || !row.name.trim()) return "Each item needs a name.";
    if (row.name.length > LIMITS.shoppingItemNameMax) return "Item name is too long.";
    if (row.quantity != null && typeof row.quantity !== "number") return "Quantity must be a number.";
  }
  return null;
}

export function validatePreferences(body: Record<string, unknown>): string | null {
  if (body.theme != null && (typeof body.theme !== "string" || !THEMES.has(body.theme))) {
    return "Theme must be light or dark.";
  }
  if (
    body.defaultUnitCategory != null &&
    (typeof body.defaultUnitCategory !== "string" || !UNIT_CATEGORIES.has(body.defaultUnitCategory))
  ) {
    return "Invalid default unit category.";
  }
  return null;
}
