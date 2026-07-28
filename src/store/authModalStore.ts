import { create } from "zustand";

export type AuthModalMode = "login" | "register" | "forgot" | "reset";

interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
  resetEmail: string;
  resetToken: string;
  openAuthModal: (mode?: AuthModalMode) => void;
  openResetModal: (email: string, token: string) => void;
  closeAuthModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  mode: "login",
  resetEmail: "",
  resetToken: "",
  openAuthModal: (mode = "login") => set({ open: true, mode }),
  openResetModal: (email, token) =>
    set({ open: true, mode: "reset", resetEmail: email, resetToken: token }),
  closeAuthModal: () => set({ open: false, mode: "login", resetEmail: "", resetToken: "" }),
}));
