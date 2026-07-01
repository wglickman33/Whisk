import { useState } from "react";
import { useShoppingListStore } from "../store/shoppingListStore";
import { toastSuccess } from "../store/toastStore";
import { formatQuantity } from "../utils/formatQuantity";
import "./ShoppingListPage.scss";

export function ShoppingListPage() {
  const { getCombined, removeItem, clearList, addItem } = useShoppingListStore();
  const combined = getCombined();
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("");

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    addItem({
      name,
      quantity: Math.max(0, Number(newQty) || 0),
      unit: newUnit.trim(),
      notes: null,
    });
    setNewName("");
    setNewQty("");
    setNewUnit("");
    toastSuccess("Item added to list.");
  };

  const handleClearList = () => {
    clearList();
    toastSuccess("List cleared.");
  };

  const handleRemoveGroup = (ids: string[]) => {
    ids.forEach((id) => removeItem(id));
  };

  return (
    <div className="shopping-list-page">
      <header className="shopping-list-page__header">
        <h1 className="shopping-list-page__title">Shopping list</h1>
        {combined.length > 0 && (
          <button
            type="button"
            className="shopping-list-page__clear"
            onClick={handleClearList}
          >
            Clear list
          </button>
        )}
      </header>

      {combined.length === 0 ? (
        <div className="shopping-list-page__empty">
          <p>Your list is empty.</p>
          <p>Add ingredients from recipes (View recipe → Add to shopping list) or add items below.</p>
        </div>
      ) : (
        <ul className="shopping-list-page__list">
          {combined.map((row) => (
            <li key={row.key} className="shopping-list-page__item">
              <span className="shopping-list-page__item-qty">
                {row.quantity > 0 ? formatQuantity(row.quantity) : ""}
              </span>
              {row.quantity > 0 && row.unit && (
                <span className="shopping-list-page__item-unit">{row.unit}</span>
              )}
              <span className="shopping-list-page__item-name">{row.name}</span>
              <button
                type="button"
                className="shopping-list-page__item-remove"
                onClick={() => handleRemoveGroup(row.ids)}
                aria-label={`Remove ${row.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="shopping-list-page__add" onSubmit={handleAddCustom}>
        <h2 className="shopping-list-page__add-title">Add item</h2>
        <div className="shopping-list-page__add-fields">
          <input
            type="text"
            placeholder="Item name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="shopping-list-page__add-name"
            aria-label="Item name"
          />
          <input
            type="number"
            placeholder="Qty"
            min={0}
            step={0.25}
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="shopping-list-page__add-qty"
            aria-label="Quantity"
          />
          <input
            type="text"
            placeholder="Unit"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="shopping-list-page__add-unit"
            aria-label="Unit"
          />
          <button type="submit" className="shopping-list-page__add-btn">
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
