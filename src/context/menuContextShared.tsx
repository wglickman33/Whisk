import { createContext, useContext } from "react";

export const MenuStateContext = createContext<{
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
} | null>(null);

export function useMenu() {
  const ctx = useContext(MenuStateContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
