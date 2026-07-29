export function buildShoppingListJoinUrl(code: string, origin = window.location.origin): string {
  const params = new URLSearchParams({ code: code.trim().toUpperCase() });
  return `${origin}/shopping-list?${params.toString()}`;
}

export const SHOPPING_LIST_PATH = "/shopping-list";
