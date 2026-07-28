import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useAuthModalStore } from "../../store/authModalStore";
import { toastSuccess, toastError } from "../../store/toastStore";
import { authApi } from "../../api/client";
import "./AuthModal.scss";

const SUCCESS_AUTO_CLOSE_MS = 1400;

export function AuthModal() {
  const { open, mode, resetEmail, resetToken, closeAuthModal, openAuthModal } = useAuthModalStore();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const successCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode === "reset" && resetEmail) setEmail(resetEmail);
  }, [mode, resetEmail, open]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        await authApi.forgotPassword(email);
        toastSuccess("If that email exists, a reset link was sent.");
        openAuthModal("login");
        return;
      }

      if (mode === "reset") {
        if (password !== confirmPassword) {
          toastError("Passwords do not match.");
          return;
        }
        await authApi.resetPassword(email, resetToken, password);
        toastSuccess("Password updated. Sign in with your new password.");
        openAuthModal("login");
        resetForm();
        return;
      }

      if (mode === "register") {
        const { user, token } = await authApi.register(email, password, name || undefined);
        await signIn(user, token);
        toastSuccess("Account created. Signing you in…");
      } else {
        const { user, token } = await authApi.login(email, password);
        await signIn(user, token);
        toastSuccess("Signed in successfully.");
      }

      if (successCloseRef.current) clearTimeout(successCloseRef.current);
      successCloseRef.current = setTimeout(() => {
        closeAuthModal();
        resetForm();
      }, SUCCESS_AUTO_CLOSE_MS);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const title =
    mode === "login"
      ? "Welcome back!"
      : mode === "register"
        ? "Create an account"
        : mode === "forgot"
          ? "Reset password"
          : "Choose a new password";

  return (
    <div
      className="auth-modal-overlay"
      onClick={closeAuthModal}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in or register"
    >
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__header">
          <h2 className="auth-modal__title">{title}</h2>
          <button type="button" className="auth-modal__close" onClick={closeAuthModal} aria-label="Close">
            <span className="auth-modal__close-icon" aria-hidden>&times;</span>
          </button>
        </div>

        {(mode === "login" || mode === "register") && (
          <div className="auth-modal__tabs">
            <button
              type="button"
              className={`auth-modal__tab ${mode === "login" ? "auth-modal__tab--active" : ""}`}
              onClick={() => openAuthModal("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`auth-modal__tab ${mode === "register" ? "auth-modal__tab--active" : ""}`}
              onClick={() => openAuthModal("register")}
            >
              Register
            </button>
          </div>
        )}

        <form className="auth-modal__form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="auth-modal__field">
              <span className="auth-modal__label">Name (optional)</span>
              <input
                type="text"
                className="auth-modal__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
          )}

          {(mode === "login" || mode === "register" || mode === "forgot" || mode === "reset") && (
            <label className="auth-modal__field">
              <span className="auth-modal__label">Email</span>
              <input
                type="email"
                className="auth-modal__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                readOnly={mode === "reset"}
                autoComplete="email"
              />
            </label>
          )}

          {(mode === "login" || mode === "register" || mode === "reset") && (
            <label className="auth-modal__field">
              <span className="auth-modal__label">
                {mode === "reset" ? "New password" : "Password"}
              </span>
              <input
                type="password"
                className="auth-modal__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>
          )}

          {mode === "reset" && (
            <label className="auth-modal__field">
              <span className="auth-modal__label">Confirm password</span>
              <input
                type="password"
                className="auth-modal__input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
          )}

          <button type="submit" className="auth-modal__submit" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset link"
                    : "Update password"}
          </button>
        </form>

        {mode === "login" && (
          <p className="auth-modal__footer">
            <button type="button" className="auth-modal__footer-link" onClick={() => openAuthModal("forgot")}>
              Forgot password?
            </button>
          </p>
        )}

        {(mode === "forgot" || mode === "reset") && (
          <p className="auth-modal__footer">
            <button type="button" className="auth-modal__footer-link" onClick={() => openAuthModal("login")}>
              Back to sign in
            </button>
          </p>
        )}

        {(mode === "login" || mode === "register") && (
          <p className="auth-modal__footer">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="auth-modal__footer-link"
              onClick={() => openAuthModal(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
