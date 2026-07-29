import { describe, it, expect, vi, afterEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ShoppingListItemRow } from "./ShoppingListItemRow";
import type { ShoppingListItem } from "../../api/client";

const sampleItem: ShoppingListItem = {
  id: "item-1",
  name: "Milk",
  quantity: "2 cups",
  note: "whole",
  category: "Dairy",
  checked: false,
  addedByUserId: "user-1",
  addedByName: "Will",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function renderRow(props: Partial<ComponentProps<typeof ShoppingListItemRow>> = {}) {
  return render(
    <ShoppingListItemRow
      item={sampleItem}
      editing={false}
      onToggleChecked={vi.fn()}
      onDelete={vi.fn()}
      onStartEdit={vi.fn()}
      onCancelEdit={vi.fn()}
      onSaveEdit={vi.fn()}
      {...props}
    />
  );
}

afterEach(() => {
  cleanup();
});

describe("ShoppingListItemRow", () => {
  it("renders item details and toggles checked from the row body", () => {
    const onToggleChecked = vi.fn();
    renderRow({ onToggleChecked });

    expect(screen.getByText("Milk")).toBeTruthy();
    expect(screen.getByText("2 cups")).toBeTruthy();
    fireEvent.click(screen.getByText("Milk"));
    expect(onToggleChecked).toHaveBeenCalled();
  });

  it("opens edit mode from the pencil button", () => {
    const onStartEdit = vi.fn();
    renderRow({ onStartEdit });

    fireEvent.click(screen.getByLabelText("Edit Milk"));
    expect(onStartEdit).toHaveBeenCalled();
  });

  it("submits edited values", () => {
    const onSaveEdit = vi.fn();
    renderRow({ editing: true, onSaveEdit });

    fireEvent.change(screen.getByLabelText("Item name"), { target: { value: "Oat milk" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSaveEdit).toHaveBeenCalledWith({
      name: "Oat milk",
      quantity: "2 cups",
      note: "whole",
      category: "Dairy",
    });
  });

  it("marks checked items with a done state", () => {
    renderRow({ item: { ...sampleItem, checked: true }, checked: true });

    expect(screen.getByLabelText("Uncheck Milk").querySelector(".shopping-list-item__check")?.textContent).toBe("✓");
  });
});
