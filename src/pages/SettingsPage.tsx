import { useSettingsStore } from "../store/settingsStore";
import { useAuthStore } from "../store/authStore";
import { useAuthModalStore } from "../store/authModalStore";
import { UNIT_CATEGORIES, CATEGORY_LABELS, type UnitCategory } from "../converters/utils/unitUtils";
import "./SettingsPage.scss";

export function SettingsPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const defaultUnitCategory = useSettingsStore((s) => s.defaultUnitCategory);
  const setDefaultUnitCategory = useSettingsStore((s) => s.setDefaultUnitCategory);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);

  if (!isSignedIn) {
    return (
      <div className="settings-page">
        <h1>Settings</h1>
        <p className="settings-page__hint">Sign in to save settings across devices.</p>
        <button type="button" className="settings-page__btn" onClick={() => openAuthModal()}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h1>Settings</h1>
        <p>Synced to your account on Whisk.</p>
      </header>

      <section className="settings-page__section">
        <h2>Appearance</h2>
        <label className="settings-page__field">
          <span>Theme</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </section>

      <section className="settings-page__section">
        <h2>Unit converter</h2>
        <label className="settings-page__field">
          <span>Default category</span>
          <select
            value={defaultUnitCategory}
            onChange={(e) => setDefaultUnitCategory(e.target.value as UnitCategory)}
          >
            {UNIT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </label>
      </section>
    </div>
  );
}
