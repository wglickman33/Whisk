import { useEffect, useId, useState } from "react";
import { inferIngredientCategory } from "../../utils/inferIngredientCategory";
import "./AddItemModal.scss";

export interface AddItemFormValues {
  name: string;
  quantity: string;
  category: string;
}

interface AddItemModalProps {
  categoryOptions: string[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: AddItemFormValues) => void;
}

export function AddItemModal({
  categoryOptions,
  saving,
  onClose,
  onSubmit,
}: AddItemModalProps) {
  const titleId = useId();
  const datalistId = useId();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [categoryEdited, setCategoryEdited] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!categoryEdited) {
      setCategory(inferIngredientCategory(value.trim()) ?? "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSubmit({
      name: trimmedName,
      quantity: quantity.trim(),
      category: category.trim(),
    });
  };

  return (
    <div
      className="add-item-modal-overlay"
      onClick={() => !saving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="add-item-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-item-modal__header">
          <h2 id={titleId}>Add item</h2>
          <button
            type="button"
            className="add-item-modal__close"
            onClick={onClose}
            aria-label="Close"
            disabled={saving}
          >
            <span aria-hidden>&times;</span>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="add-item-modal__body">
            <label className="add-item-modal__field">
              <span>Item name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Soy sauce"
                required
                autoFocus
                disabled={saving}
              />
            </label>
            <label className="add-item-modal__field">
              <span>Quantity</span>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 2 cups"
                disabled={saving}
              />
            </label>
            <label className="add-item-modal__field">
              <span>Category</span>
              <input
                type="text"
                value={category}
                onChange={(e) => {
                  setCategoryEdited(true);
                  setCategory(e.target.value);
                }}
                placeholder="Optional, auto-suggested from name"
                list={datalistId}
                disabled={saving}
              />
              <datalist id={datalistId}>
                {categoryOptions.map((label) => (
                  <option key={label} value={label} />
                ))}
              </datalist>
            </label>
          </div>
          <div className="add-item-modal__actions">
            <button type="button" className="add-item-modal__cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="add-item-modal__submit" disabled={saving || !name.trim()}>
              {saving ? "Adding…" : "Add to list"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
