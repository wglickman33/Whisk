import { useState } from "react";
import { useSettingsStore, type Theme } from "../store/settingsStore";
import { useAuthStore } from "../store/authStore";
import { useAuthModalStore } from "../store/authModalStore";
import { toastSuccess, toastError } from "../store/toastStore";
import { UNIT_CATEGORIES, CATEGORY_LABELS, type UnitCategory } from "../converters/units/unitUtils";
import "./SettingsPage.scss";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const signOut = useAuthStore((s) => s.signOut);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const defaultUnitCategory = useSettingsStore((s) => s.defaultUnitCategory);
  const setDefaultUnitCategory = useSettingsStore((s) => s.setDefaultUnitCategory);
  const savePreferences = useSettingsStore((s) => s.savePreferences);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePreferences();
      toastSuccess(isSignedIn ? "Settings saved to your account." : "Settings saved.");
    } catch {
      toastError("Could not save settings. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h1>Settings</h1>
        <p>
          {isSignedIn
            ? "Changes apply immediately on this device. Save to sync across devices."
            : "Preferences are saved on this device. Sign in to sync across devices."}
        </p>
      </header>

      {!isLoading && !isSignedIn && (
        <div className="settings-page__banner">
          <p>Sign in to keep settings on all your devices.</p>
          <button type="button" className="settings-page__btn" onClick={() => openAuthModal()}>
            Sign in
          </button>
        </div>
      )}

      <section className="settings-page__section">
        <h2>Appearance</h2>
        <div className="settings-page__field">
          <span className="settings-page__label">Theme</span>
          <div className="settings-page__segmented" role="group" aria-label="Theme">
            {THEME_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`settings-page__segment${theme === value ? " settings-page__segment--active" : ""}`}
                aria-pressed={theme === value}
                onClick={() => setTheme(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="settings-page__hint">
            Auto follows your device&apos;s light or dark setting.
          </p>
        </div>
      </section>

      <section className="settings-page__section">
        <h2>Unit converter</h2>
        <label className="settings-page__field">
          <span className="settings-page__label">Default category</span>
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

      <div className="settings-page__save-row">
        <button
          type="button"
          className="settings-page__save-btn"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        {isSignedIn && (
          <p className="settings-page__save-hint">Required to sync theme and unit defaults to your account.</p>
        )}
      </div>

      {isSignedIn && (
        <section className="settings-page__section">
          <h2>Account</h2>
          <dl className="settings-page__profile">
            {user?.name && (
              <>
                <dt>Name</dt>
                <dd>{user.name}</dd>
              </>
            )}
            <dt>Email</dt>
            <dd>{user?.email}</dd>
          </dl>
          <div className="settings-page__actions">
            <button
              type="button"
              className="settings-page__action-btn settings-page__action-btn--password"
              onClick={() => openAuthModal("forgot")}
            >
              Change password
            </button>
            <button
              type="button"
              className="settings-page__action-btn settings-page__action-btn--signout"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
