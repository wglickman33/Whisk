import { useEffect, useState } from "react";
import type { ShoppingListItem } from "../../api/client";
import "./ShoppingListItemRow.scss";

export interface ItemEditDraft {
  name: string;
  quantity: string;
  note: string;
  category: string;
}

export function toEditDraft(item: ShoppingListItem): ItemEditDraft {
  return {
    name: item.name,
    quantity: item.quantity ?? "",
    note: item.note ?? "",
    category: item.category ?? "",
  };
}

interface ShoppingListItemRowProps {
  item: ShoppingListItem;
  checked?: boolean;
  editing: boolean;
  saving?: boolean;
  onToggleChecked: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (draft: ItemEditDraft) => void;
}

export function ShoppingListItemRow({
  item,
  checked = false,
  editing,
  saving = false,
  onToggleChecked,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}: ShoppingListItemRowProps) {
  const [draft, setDraft] = useState<ItemEditDraft>(() => toEditDraft(item));

  useEffect(() => {
    if (editing) setDraft(toEditDraft(item));
  }, [editing, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onSaveEdit({
      name: draft.name.trim(),
      quantity: draft.quantity.trim(),
      note: draft.note.trim(),
      category: draft.category.trim(),
    });
  };

  return (
    <li className={`shopping-list-item ${checked ? "shopping-list-item--checked" : ""}`}>
      {editing ? (
        <>
          <span
            className={`shopping-list-item__check ${checked ? "shopping-list-item__check--done" : ""}`}
            aria-hidden="true"
          >
            {checked ? "✓" : null}
          </span>
          <form className="shopping-list-item__edit" onSubmit={handleSubmit}>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              aria-label="Item name"
              required
              disabled={saving}
            />
            <div className="shopping-list-item__edit-row">
              <input
                type="text"
                value={draft.quantity}
                onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))}
                placeholder="Qty"
                aria-label="Quantity"
                disabled={saving}
              />
              <input
                type="text"
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                placeholder="Category"
                aria-label="Category"
                disabled={saving}
              />
            </div>
            <input
              type="text"
              value={draft.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              placeholder="Note"
              aria-label="Note"
              disabled={saving}
            />
            <div className="shopping-list-item__edit-actions">
              <button type="button" onClick={onCancelEdit} disabled={saving}>
                Cancel
              </button>
              <button type="submit" disabled={saving || !draft.name.trim()}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <button
            type="button"
            className="shopping-list-item__main"
            onClick={onToggleChecked}
            aria-pressed={checked}
            aria-label={checked ? `Uncheck ${item.name}` : `Mark ${item.name} as done`}
          >
            <span
              className={`shopping-list-item__check ${checked ? "shopping-list-item__check--done" : ""}`}
              aria-hidden="true"
            >
              {checked ? "✓" : null}
            </span>
            <span className="shopping-list-item__content">
              <span className="shopping-list-item__name">{item.name}</span>
              {(item.quantity || item.note) && (
                <span className="shopping-list-item__meta">
                  {item.quantity && <span className="shopping-list-item__qty">{item.quantity}</span>}
                  {item.note && <span className="shopping-list-item__note">{item.note}</span>}
                </span>
              )}
            </span>
            {item.addedByName && (
              <span className="shopping-list-item__added-by">{item.addedByName}</span>
            )}
          </button>
          <button
            type="button"
            className="shopping-list-item__edit-btn"
            onClick={onStartEdit}
            aria-label={`Edit ${item.name}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <button
            type="button"
            className="shopping-list-item__remove"
            onClick={onDelete}
            aria-label={`Remove ${item.name}`}
          >
            ×
          </button>
        </>
      )}
    </li>
  );
}
