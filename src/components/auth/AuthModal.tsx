import { useState, useCallback, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { useAuthModalStore } from "../../store/authModalStore";
import { toastSuccess, toastError } from "../../store/toastStore";
import { authApi } from "../../api/client";
import "./AuthModal.scss";

const SUCCESS_AUTO_CLOSE_MS = 1400;

export function AuthModal() {
  const { open, closeAuthModal } = useAuthModalStore();
  const signIn = useAuthStore((s) => s.signIn);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const successCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const { user, token } = await authApi.register(email, password, name || undefined);
        signIn(user, token);
        toastSuccess("Account created. Signing you in…");
      } else {
        const { user, token } = await authApi.login(email, password);
        signIn(user, token);
        toastSuccess("Signed in successfully.");
      }
      if (successCloseRef.current) clearTimeout(successCloseRef.current);
      successCloseRef.current = setTimeout(() => {
        closeAuthModal();
        setEmail("");
        setPassword("");
        setName("");
      }, SUCCESS_AUTO_CLOSE_MS);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = useCallback((next: "login" | "register") => {
    setMode(next);
  }, []);

  if (!open) return null;

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
          <h2 className="auth-modal__title">
            {mode === "login" ? "Welcome back!" : "Create an account"}
          </h2>
          <button
            type="button"
            className="auth-modal__close"
            onClick={closeAuthModal}
            aria-label="Close"
          >
            <span className="auth-modal__close-icon" aria-hidden>&times;</span>
          </button>
        </div>

        <div className="auth-modal__tabs">
          <button
            type="button"
            className={`auth-modal__tab ${mode === "login" ? "auth-modal__tab--active" : ""}`}
            onClick={() => switchMode("login")}
            aria-pressed={mode === "login"}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-modal__tab ${mode === "register" ? "auth-modal__tab--active" : ""}`}
            onClick={() => switchMode("register")}
            aria-pressed={mode === "register"}
          >
            Register
          </button>
        </div>

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
                placeholder="Your name"
              />
            </label>
          )}
          <label className="auth-modal__field">
            <span className="auth-modal__label">Email</span>
            <input
              type="email"
              className="auth-modal__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label className="auth-modal__field">
            <span className="auth-modal__label">Password</span>
            <input
              type="password"
              className="auth-modal__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              placeholder={mode === "login" ? "Your password" : "At least 6 characters"}
            />
          </label>
          <button type="submit" className="auth-modal__submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="auth-modal__footer">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            className="auth-modal__footer-link"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
