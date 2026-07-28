import type { Recipe } from "../api/client";

export function filterRecipes(
  recipes: Recipe[],
  query: string,
  folderId: string | null
): Recipe[] {
  const q = query.trim().toLowerCase();

  return recipes.filter((recipe) => {
    if (folderId && recipe.folder?.id !== folderId) return false;
    if (!q) return true;

    if (recipe.title.toLowerCase().includes(q)) return true;
    if (recipe.description?.toLowerCase().includes(q)) return true;
    if (recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q))) return true;
    if (recipe.tags?.some((t) => t.tag.label.toLowerCase().includes(q))) return true;
    return false;
  });
}
