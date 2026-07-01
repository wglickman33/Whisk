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

export const authApi = {
  register: (email: string, password: string, name?: string) =>
    api<{ user: { id: string; email: string; name: string | null }; token: string }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify({ email, password, name }) }
    ),
  login: (email: string, password: string) =>
    api<{ user: { id: string; email: string; name: string | null }; token: string }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  me: () =>
    api<{ id: string; email: string; name: string | null }>("/api/auth/me"),
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
  ingredients?: { name: string; quantity?: number; unit?: string; notes?: string | null; isOptional?: boolean }[];
  steps?: { instruction: string; timerMinutes?: number | null }[];
}

export const recipesApi = {
  list: () => api<{ recipes: Recipe[] }>("/api/recipes"),
  get: (id: string) => api<Recipe>(`/api/recipes/${id}`),
  create: (body: RecipeInput) =>
    api<Recipe>("/api/recipes", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<RecipeInput>) =>
    api<Recipe>(`/api/recipes/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) =>
    api<void>(`/api/recipes/${id}`, { method: "DELETE" }),
};
