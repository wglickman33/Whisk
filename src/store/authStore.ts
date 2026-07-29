import { create } from "zustand";
import { authApi, type AuthUser } from "../api/client";
import { syncUserDataFromServer, clearUserSyncedState } from "../services/userSync";
import { clearStoredListId } from "../utils/shoppingListUtils";
import { useShoppingActivityStore } from "./shoppingActivityStore";
import { useSettingsStore } from "./settingsStore";

const TOKEN_KEY = "whisk_token";
const USER_CACHE_KEY = "whisk_user_cache";

let restorePromise: Promise<void> | null = null;

function getStoredToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function readCachedUser(): AuthUser | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function cacheUser(user: AuthUser): void {
  localStorage.setItem(
    USER_CACHE_KEY,
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name ?? null,
    })
  );
}

function clearCachedUser(): void {
  localStorage.removeItem(USER_CACHE_KEY);
}

function getInitialAuthState(): Pick<AuthState, "user" | "isSignedIn" | "isLoading"> {
  const token = getStoredToken();
  return {
    user: token ? readCachedUser() : null,
    isSignedIn: !!token,
    isLoading: !!token,
  };
}

async function afterAuth(user: AuthUser, token: string): Promise<void> {
  localStorage.setItem(TOKEN_KEY, token);
  cacheUser(user);
  await syncUserDataFromServer().catch(() => {
    /* offline — local data still usable; sync flags stay off until next successful sync */
  });
}

interface AuthState {
  user: AuthUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signIn: (user: AuthUser, token: string) => Promise<void>;
  signOut: () => void;
  setUser: (user: AuthUser | null) => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialAuthState(),

  signIn: async (user, token) => {
    await afterAuth(user, token);
    set({ user, isSignedIn: true, isLoading: false });
  },

  signOut: () => {
    localStorage.removeItem(TOKEN_KEY);
    clearCachedUser();
    clearStoredListId();
    useShoppingActivityStore.getState().clear();
    clearUserSyncedState();
    useSettingsStore.getState().resetSyncState();
    set({ user: null, isSignedIn: false, isLoading: false });
  },

  setUser: (user) => {
    if (user) cacheUser(user);
    set({ user, isSignedIn: !!user });
  },

  restoreSession: () => {
    if (restorePromise) return restorePromise;

    restorePromise = (async () => {
      const token = getStoredToken();
      if (!token) {
        set({ user: null, isSignedIn: false, isLoading: false });
        return;
      }

      set((state) => ({
        isSignedIn: true,
        isLoading: true,
        user: state.user ?? readCachedUser(),
      }));

      try {
        const user = await authApi.me();
        await afterAuth(user, token);
        set({ user, isSignedIn: true, isLoading: false });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        clearCachedUser();
        set({ user: null, isSignedIn: false, isLoading: false });
      } finally {
        restorePromise = null;
      }
    })();

    return restorePromise;
  },
}));

/** Start session restore before the first React render when possible. */
export function bootstrapAuthSession(): void {
  void useAuthStore.getState().restoreSession();
}
