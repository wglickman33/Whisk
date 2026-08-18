import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { useAuthModalStore } from "../store/authModalStore";
import { useSousStore } from "../store/sousStore";
import { IconSous } from "../components/ui/SidebarIcons";
import { SousChatPane } from "../components/sous/SousChatPane";
import {
  sousToolLabel,
  summarizeSousInput,
  summarizeSousOutput,
} from "../utils/sousTrace";
import "./SousPage.scss";

export function SousPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  const sending = useSousStore((s) => s.sending);
  const traceSteps = useSousStore((s) => s.traceSteps);
  const closeWidget = useSousStore((s) => s.closeWidget);
  const traceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeWidget();
  }, [closeWidget]);

  useEffect(() => {
    traceRef.current?.scrollTo({ top: traceRef.current.scrollHeight });
  }, [traceSteps]);

  if (!isLoading && !isSignedIn) {
    return (
      <div className="sous-page">
        <header className="sous-page__header">
          <h1>Sous AI</h1>
        </header>
        <div className="sous-page__guest-overlay">
          <div className="sous-page__guest-center">
            <div className="sous-page__guest">
              <span className="sous-page__guest-icon" aria-hidden>
                <IconSous />
              </span>
              <p className="sous-page__guest-text">Sign in to chat with Sous AI.</p>
              <p className="sous-page__guest-sub">
                Recipes, substitutions, and shopping lists, private to your account.
              </p>
              <button type="button" className="sous-page__cta" onClick={() => openAuthModal("login")}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sous-page">
      <header className="sous-page__header">
        <h1>Sous AI</h1>
        <p>Your kitchen assistant. Ask about saved recipes, substitutions, or your shopping list.</p>
      </header>

      <div className="sous-page__workspace">
        <div className="sous-page__chat">
          <SousChatPane variant="page" inputId="sous-message" />
        </div>

        <aside className="sous-page__trace" aria-label="Sous AI lookups">
          <div className="sous-page__trace-head">
            <h2>Lookups</h2>
            <p>What Sous AI is checking, as it happens.</p>
          </div>
          <div className="sous-page__trace-body" ref={traceRef} aria-live="polite">
            {traceSteps.length === 0 ? (
              <p className="sous-page__trace-empty">
                {sending
                  ? "Starting lookup..."
                  : "Recipe, substitute, and list lookups will show up here."}
              </p>
            ) : (
              <ol className="sous-page__steps">
                {traceSteps.map((step) => {
                  const detail =
                    step.status === "done"
                      ? summarizeSousOutput(step.name, step.output)
                      : summarizeSousInput(step.name, step.input);
                  return (
                    <li
                      key={step.id}
                      className={`sous-page__step ${
                        step.status === "running" ? "sous-page__step--running" : ""
                      }`}
                    >
                      <p className="sous-page__step-label">{sousToolLabel(step.name)}</p>
                      {detail ? <p className="sous-page__step-detail">{detail}</p> : null}
                      {step.status === "running" ? (
                        <p className="sous-page__step-status">Working...</p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
