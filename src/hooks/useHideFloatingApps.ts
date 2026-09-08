import { useEffect } from "react";

const BODY_CLASS = "whisk-hide-fab";

/** Hide the global apps FAB while a full-screen modal is open (more reliable than CSS :has on mobile). */
export function useHideFloatingApps(active: boolean) {
  useEffect(() => {
    if (!active) return;
    document.body.classList.add(BODY_CLASS);
    return () => {
      document.body.classList.remove(BODY_CLASS);
    };
  }, [active]);
}
