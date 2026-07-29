const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function getToken(): string | null {
  return localStorage.getItem("whisk_token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data as T;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  theme?: string;
  defaultUnitCategory?: string;
  createdAt?: string;
}

export interface UserPreferences {
  theme: string;
  defaultUnitCategory: string;
}

export const authApi = {
  register: (email: string, password: string, name?: string) =>
    api<{ user: AuthUser; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    api<{ user: AuthUser; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<AuthUser>("/api/auth/me"),
  forgotPassword: (email: string) =>
    api<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (email: string, token: string, password: string) =>
    api<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, token, password }),
    }),
};

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  isOptional: boolean;
  order: number;
}

export interface Step {
  id: string;
  order: number;
  instruction: string;
  timerMinutes: number | null;
  imageUrl: string | null;
}

export interface RecipeTag {
  tag: { id: string; label: string; color: string | null };
}

export interface RecipeFolder {
  id: string;
  name: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  type: string;
  servings: number;
  servingUnit: string;
  prepTime: number | null;
  cookTime: number | null;
  notes: string | null;
  sourceUrl: string | null;
  unitSystem: string;
  folderId?: string | null;
  folder?: RecipeFolder | null;
  tags?: RecipeTag[];
  createdAt: string;
  updatedAt: string;
  ingredients: Ingredient[];
  steps: Step[];
}

export interface RecipeInput {
  title: string;
  description?: string | null;
  type?: string;
  servings: number;
  servingUnit?: string;
  prepTime?: number | null;
  cookTime?: number | null;
  notes?: string | null;
  sourceUrl?: string | null;
  unitSystem?: string;
  folderId?: string | null;
  ingredients?: {
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string | null;
    isOptional?: boolean;
  }[];
  steps?: { instruction: string; timerMinutes?: number | null; imageUrl?: string | null }[];
}

export const recipesApi = {
  list: () => api<{ recipes: Recipe[] }>("/api/recipes"),
  get: (id: string) => api<Recipe>(`/api/recipes/${id}`),
  create: (body: RecipeInput) =>
    api<Recipe>("/api/recipes", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<RecipeInput>) =>
    api<Recipe>(`/api/recipes/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`/api/recipes/${id}`, { method: "DELETE" }),
  importUrl: (url: string) =>
    api<Recipe>("/api/recipes/import-url", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
};

export interface ShoppingListMember {
  id: string;
  name: string;
  initial: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  ownerUserId: string;
  isOwner: boolean;
  shareCode?: string;
  createdAt: string;
  members: ShoppingListMember[];
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category?: string;
  quantity?: string;
  note?: string;
  checked: boolean;
  addedByUserId: string;
  addedByName: string;
  createdAt: string;
}

export interface ShoppingListItemInput {
  name: string;
  category?: string | null;
  quantity?: string | null;
  note?: string | null;
}

export const shoppingListsApi = {
  list: () => api<{ lists: ShoppingList[] }>("/api/shopping-lists"),
  create: (name: string) =>
    api<{ list: ShoppingList }>("/api/shopping-lists", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  getItems: (listId: string) =>
    api<{ items: ShoppingListItem[] }>(`/api/shopping-lists/${listId}/items`),
  addItem: (listId: string, item: ShoppingListItemInput) =>
    api<{ item: ShoppingListItem }>(`/api/shopping-lists/${listId}/items`, {
      method: "POST",
      body: JSON.stringify(item),
    }),
  bulkAdd: (listId: string, items: ShoppingListItemInput[]) =>
    api<{ items: ShoppingListItem[] }>(`/api/shopping-lists/${listId}/items/bulk`, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
  updateItem: (
    listId: string,
    itemId: string,
    patch: Partial<Pick<ShoppingListItem, "name" | "category" | "quantity" | "note" | "checked">>
  ) =>
    api<{ item: ShoppingListItem }>(`/api/shopping-lists/${listId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteItem: (listId: string, itemId: string) =>
    api<void>(`/api/shopping-lists/${listId}/items/${itemId}`, { method: "DELETE" }),
  clearChecked: (listId: string) =>
    api<void>(`/api/shopping-lists/${listId}/items/checked`, { method: "DELETE" }),
  generateShareCode: (listId: string) =>
    api<{ code: string }>(`/api/shopping-lists/${listId}/share-code`, { method: "POST" }),
  join: (code: string) =>
    api<{ list: ShoppingList }>("/api/shopping-lists/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  update: (listId: string, name: string) =>
    api<{ list: ShoppingList }>(`/api/shopping-lists/${listId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  delete: (listId: string) =>
    api<void>(`/api/shopping-lists/${listId}`, { method: "DELETE" }),
  leave: (listId: string) =>
    api<void>(`/api/shopping-lists/${listId}/leave`, { method: "POST" }),
  removeMember: (listId: string, memberUserId: string) =>
    api<{ list: ShoppingList }>(`/api/shopping-lists/${listId}/members/${memberUserId}`, {
      method: "DELETE",
    }),
};

export const preferencesApi = {
  get: () => api<UserPreferences>("/api/me/preferences"),
  update: (body: Partial<UserPreferences>) =>
    api<UserPreferences>("/api/me/preferences", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export interface FolderSummary {
  id: string;
  name: string;
  recipeCount: number;
}

export interface Tag {
  id: string;
  label: string;
  color: string | null;
}

export const foldersApi = {
  list: () => api<{ folders: FolderSummary[] }>("/api/folders"),
  create: (name: string) =>
    api<FolderSummary>("/api/folders", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  delete: (id: string) => api<void>(`/api/folders/${id}`, { method: "DELETE" }),
};

export const tagsApi = {
  list: () => api<{ tags: Tag[] }>("/api/tags"),
  create: (label: string, color?: string | null) =>
    api<Tag>("/api/tags", {
      method: "POST",
      body: JSON.stringify({ label, color }),
    }),
  delete: (id: string) => api<void>(`/api/tags/${id}`, { method: "DELETE" }),
  setRecipeTags: (recipeId: string, tagIds: string[]) =>
    api<{ tags: Tag[] }>(`/api/tags/recipes/${recipeId}`, {
      method: "PUT",
      body: JSON.stringify({ tagIds }),
    }),
};

export const substitutesApi = {
  get: async (ingredientName: string): Promise<string[]> => {
    const params = new URLSearchParams({ name: ingredientName });
    const data = await api<{ substitutes: string[] }>(
      `/api/ingredients/substitutes?${params.toString()}`
    );
    return Array.isArray(data.substitutes) ? data.substitutes : [];
  },
};
