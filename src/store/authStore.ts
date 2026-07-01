import { create } from "zustand";
import { authApi } from "../api/client";

const TOKEN_KEY = "whisk_token";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: User | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signIn: (user: User, token: string) => void;
  signOut: () => void;
  setUser: (user: User | null) => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isSignedIn: false,
  isLoading: true,

  signIn: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ user, isSignedIn: true });
  },

  signOut: () => {
    localStorage.removeItem(TOKEN_KEY);
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
      set({ user, isSignedIn: true });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, isSignedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
