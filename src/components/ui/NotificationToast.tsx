import { useToastStore, type ToastItem } from "../../store/toastStore";
import "./NotificationToast.scss";

function ToastItem({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const icon = item.type === "success" ? "✓" : item.type === "error" ? "✕" : item.type === "warning" ? "!" : "i";
  return (
    <div
      className={`notification-toast notification-toast--${item.type}`}
      role={item.type === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="notification-toast__content">
        <span className="notification-toast__icon" aria-hidden>
          {icon}
        </span>
        <span className="notification-toast__message">{item.message}</span>
      </div>
      <button
        type="button"
        className="notification-toast__close"
        onClick={onClose}
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
