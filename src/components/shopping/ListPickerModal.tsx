import { useEffect, type RefObject } from "react";
import type { ShoppingList } from "../../api/client";
import "./ListPickerModal.scss";

export interface ListPickerModalProps {
  title?: string;
  lists: ShoppingList[];
  saving: boolean;
  showCreate?: boolean;
  onClose: () => void;
  onSelect: (listId: string) => void;
  onCreate?: () => void;
}

export function ListPickerModal({
  title = "Choose a shopping list",
  lists,
  saving,
  showCreate = true,
  onClose,
  onSelect,
  onCreate,
}: ListPickerModalProps) {
  const titleId = "list-picker-title";

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  return (
    <div
      className="list-picker-overlay"
      onClick={() => !saving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="list-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="list-picker-modal__header">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="list-picker-modal__close"
            onClick={onClose}
            aria-label="Close"
            disabled={saving}
          >
            <span aria-hidden>&times;</span>
          </button>
        </div>
        <div className="list-picker-modal__body">
          <ul className="list-picker-modal__list">
            {lists.map((list) => (
              <li key={list.id}>
                <button
                  type="button"
                  className="list-picker-modal__btn"
                  disabled={saving}
                  onClick={() => onSelect(list.id)}
                >
                  <span className="list-picker-modal__name">{list.name}</span>
                  <span className="list-picker-modal__meta">
                    {list.members.length} member{list.members.length === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {showCreate && onCreate && (
            <button type="button" className="list-picker-modal__create" onClick={onCreate} disabled={saving}>
              + Create new list
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutside: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside, enabled]);
}
