import { create } from "zustand";
import { authApi, type AuthUser } from "../api/client";
import { syncUserDataFromServer, clearUserSyncedState } from "../services/userSync";
import { useSettingsStore } from "./settingsStore";

const TOKEN_KEY = "whisk_token";

interface AuthState {
  user: AuthUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signIn: (user: AuthUser, token: string) => Promise<void>;
  signOut: () => void;
  setUser: (user: AuthUser | null) => void;
  restoreSession: () => Promise<void>;
}

async function afterAuth(_user: AuthUser, token: string): Promise<void> {
  localStorage.setItem(TOKEN_KEY, token);
  await syncUserDataFromServer().catch(() => {
    /* offline — local data still usable; sync flags stay off until next successful sync */
  });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isSignedIn: false,
  isLoading: true,

  signIn: async (user, token) => {
    await afterAuth(user, token);
    set({ user, isSignedIn: true });
  },

  signOut: () => {
    localStorage.removeItem(TOKEN_KEY);
    clearUserSyncedState();
    useSettingsStore.getState().resetSyncState();
    set({ user: null, isSignedIn: false });
  },

  setUser: (user) => set({ user, isSignedIn: !!user }),

  restoreSession: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await authApi.me();
      await afterAuth(user, token);
      set({ user, isSignedIn: true });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, isSignedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
