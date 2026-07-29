import { useEffect } from "react";
import { formatDuplicatePrompt } from "../../utils/shoppingListDedupe";
import "./DuplicateItemsModal.scss";

interface DuplicateItemsModalProps {
  names: string[];
  listName: string;
  missingCount: number;
  saving?: boolean;
  onCancel: () => void;
  onAddMissing: () => void;
  onConfirm: () => void;
}

export function DuplicateItemsModal({
  names,
  listName,
  missingCount,
  saving = false,
  onCancel,
  onAddMissing,
  onConfirm,
}: DuplicateItemsModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, saving]);

  return (
    <div className="duplicate-items-modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="duplicate-items-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Already on the list</h2>
        <p>{formatDuplicatePrompt(names)}</p>
        <p className="duplicate-items-modal__hint">
          Choose what to add to <strong>{listName}</strong>.
        </p>
        <ul className="duplicate-items-modal__names">
          {names.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <div className="duplicate-items-modal__actions">
          <button type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          {missingCount > 0 && (
            <button
              type="button"
              className="duplicate-items-modal__missing"
              onClick={onAddMissing}
              disabled={saving}
            >
              {saving ? "Adding…" : `Add missing only (${missingCount})`}
            </button>
          )}
          <button type="button" className="duplicate-items-modal__confirm" onClick={onConfirm} disabled={saving}>
            {saving ? "Adding…" : "Add all anyway"}
          </button>
        </div>
      </div>
    </div>
  );
}
