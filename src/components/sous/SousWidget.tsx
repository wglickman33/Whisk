import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAuthModalStore } from "../../store/authModalStore";
import { useSousStore } from "../../store/sousStore";
import { IconSous } from "../ui/SidebarIcons";
import { SousChatPane } from "./SousChatPane";
import "./SousWidget.scss";

export function SousWidget() {
  const location = useLocation();
  const widgetOpen = useSousStore((s) => s.widgetOpen);
  const closeWidget = useSousStore((s) => s.closeWidget);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  const onSousPage = location.pathname === "/sous";

  useEffect(() => {
    if (!widgetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWidget();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [widgetOpen, closeWidget]);

  if (!widgetOpen || onSousPage) return null;

  return (
    <section className="sous-widget" role="dialog" aria-labelledby="sous-widget-title">
      <header className="sous-widget__header">
        <div className="sous-widget__brand">
          <span className="sous-widget__icon" aria-hidden>
            <IconSous />
          </span>
          <div>
            <h2 id="sous-widget-title">Sous AI</h2>
            <p>Kitchen assistant</p>
          </div>
        </div>
        <button type="button" className="sous-widget__close" onClick={closeWidget} aria-label="Close Sous AI">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      {!isLoading && !isSignedIn ? (
        <div className="sous-widget__guest">
          <p>Sign in to chat with Sous AI.</p>
          <p>Recipes, substitutions, and lists stay private to your account.</p>
          <button type="button" className="sous-widget__cta" onClick={() => openAuthModal("login")}>
            Sign In
          </button>
        </div>
      ) : (
        <SousChatPane variant="widget" inputId="sous-widget-message" />
      )}

      <footer className="sous-widget__footer">
        <Link to="/sous" className="sous-widget__full" onClick={closeWidget}>
          Open full view
        </Link>
      </footer>
    </section>
  );
}
