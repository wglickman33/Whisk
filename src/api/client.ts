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
  steps?: { instruction: string; timerMinutes?: number | null }[];
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

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  sourceRecipeId?: string;
  sourceRecipeTitle?: string;
}

export type ShoppingListItemInput = Omit<ShoppingListItem, "id">;

export const shoppingListApi = {
  get: () => api<{ items: ShoppingListItem[] }>("/api/shopping-list"),
  save: (items: ShoppingListItemInput[]) =>
    api<{ items: ShoppingListItem[] }>("/api/shopping-list", {
      method: "PUT",
      body: JSON.stringify({ items }),
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
