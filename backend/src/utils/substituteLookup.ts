import { substituteFallback } from "../data/substituteFallback.js";
import type { SubstituteOption } from "./dietaryPreferences.js";

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function stripPlural(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

function nameVariants(name: string): string[] {
  const normalized = normalizeIngredientName(name);
  const stripped = stripPlural(normalized);
  const variants = new Set([normalized, stripped]);
  for (const part of normalized.split(/[,/()]+/)) {
    const p = part.trim();
    if (p) {
      variants.add(p);
      variants.add(stripPlural(p));
    }
  }
  return [...variants];
}

/** Case-insensitive fallback lookup with substring matching. */
export function findFallbackSubstitutes(ingredientName: string): SubstituteOption[] {
  const variants = nameVariants(ingredientName);

  for (const variant of variants) {
    if (substituteFallback[variant]) return substituteFallback[variant];
  }

  const entries = Object.entries(substituteFallback).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const variant of variants) {
    for (const [key, subs] of entries) {
      const keyNorm = key.toLowerCase();
      if (variant.includes(keyNorm) || keyNorm.includes(variant)) {
        return subs;
      }
    }
  }

  return [];
}
