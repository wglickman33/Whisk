import { Link } from "react-router-dom";
import { whiskLogoCharcoal, whiskLogoWhite } from "../assets/logos";
import { IconMoon, IconSun } from "../components/ui/AnimatedIcon";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";
import "./NotFoundPage.scss";

export function NotFoundPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const theme = useSettingsStore((s) => s.theme);
  const effectiveTheme = useSettingsStore((s) => s.effectiveTheme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);

  const homeTo = isSignedIn ? "/recipes" : "/";
  const homeLabel = isSignedIn ? "Back to recipes" : "Back home";

  return (
    <div className="not-found-page">
      <button
        type="button"
        className="not-found-page__theme"
        onClick={toggleTheme}
        aria-label={
          theme === "auto"
            ? `Theme: Auto (${effectiveTheme}). Click to switch.`
            : effectiveTheme === "light"
              ? "Switch to dark mode"
              : "Switch to auto mode"
        }
        title={
          theme === "auto"
            ? `Auto (${effectiveTheme === "light" ? "light" : "dark"})`
            : theme === "light"
              ? "Dark mode"
              : "Auto mode"
        }
      >
        {effectiveTheme === "light" ? <IconMoon /> : <IconSun />}
      </button>

      <main className="not-found-page__panel">
        <div className="not-found-page__logo-wrap">
          <img
            src={whiskLogoCharcoal}
            alt=""
            className="not-found-page__logo not-found-page__logo--charcoal"
          />
          <img
            src={whiskLogoWhite}
            alt=""
            className="not-found-page__logo not-found-page__logo--white"
          />
        </div>
        <p className="not-found-page__brand">Whisk</p>
        <p className="not-found-page__code" aria-hidden="true">
          404
        </p>
        <h1 className="not-found-page__title">Page not found</h1>
        <p className="not-found-page__copy">
          That link does not match anything in Whisk. Head back and keep cooking.
        </p>
        <div className="not-found-page__actions">
          <Link to={homeTo} className="not-found-page__btn not-found-page__btn--primary">
            {homeLabel}
          </Link>
          <Link to="/how-it-works" className="not-found-page__btn not-found-page__btn--ghost">
            How it works
          </Link>
        </div>
      </main>
    </div>
  );
}
