import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToastStore, type ToastItem } from "../../store/toastStore";
import "./NotificationToast.scss";

const AUTO_DISMISS_MS = 5000;
const EXIT_ANIMATION_MS = 300;

function ToastItem({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [exiting, setExiting] = useState(false);
  const icon = item.type === "success" ? "✓" : item.type === "error" ? "✕" : item.type === "warning" ? "!" : "i";

  const dismiss = useCallback(() => {
    setExiting(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [dismiss]);

  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(onClose, EXIT_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [exiting, onClose]);

  return (
    <div
      className={`notification-toast notification-toast--${item.type}${exiting ? " notification-toast--exit" : ""}`}
      role={item.type === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="notification-toast__content">
        <span className="notification-toast__icon" aria-hidden>
          {icon}
        </span>
        <div className="notification-toast__text">
          <span className="notification-toast__message">{item.message}</span>
          {item.actionHref && item.actionLabel && (
            <Link
              to={item.actionHref}
              className="notification-toast__action"
              onClick={() => {
                item.onAction?.();
                dismiss();
              }}
            >
              {item.actionLabel}
            </Link>
          )}
        </div>
      </div>
      <button
        type="button"
        className="notification-toast__close"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function NotificationToastContainer() {
  const items = useToastStore((s) => s.items);
  const remove = useToastStore((s) => s.remove);

  if (items.length === 0) return null;

  return (
    <div
      className="notification-toast-container"
      role="region"
      aria-label="Notifications"
    >
      {items.map((item) => (
        <ToastItem
          key={item.id}
          item={item}
          onClose={() => remove(item.id)}
        />
      ))}
    </div>
  );
}
