import { describe, it, expect } from "vitest";
import { detectRemoteItemAdds, formatRemoteAddMessage } from "./shoppingListNotifications";
import type { ShoppingListItem } from "../api/client";

function item(
  id: string,
  name: string,
  addedByUserId: string
): ShoppingListItem {
  return {
    id,
    name,
    checked: false,
    addedByUserId,
    addedByName: "Someone",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("detectRemoteItemAdds", () => {
  it("counts items added by other users", () => {
    const previous = [item("1", "Milk", "me")];
    const next = [
      ...previous,
      item("2", "Eggs", "other"),
      item("3", "Bread", "me"),
    ];
    expect(detectRemoteItemAdds(previous, next, "me")).toEqual({
      count: 1,
      names: ["Eggs"],
    });
  });

  it("ignores items the current user added", () => {
    const previous: ShoppingListItem[] = [];
    const next = [item("1", "Butter", "me")];
    expect(detectRemoteItemAdds(previous, next, "me")).toEqual({
      count: 0,
      names: [],
    });
  });
});

describe("formatRemoteAddMessage", () => {
  it("formats single and multiple additions", () => {
    expect(formatRemoteAddMessage(["Milk"], 1)).toBe("Milk was added to the list.");
    expect(formatRemoteAddMessage(["Milk", "Eggs"], 2)).toBe("Milk and Eggs were added.");
    expect(formatRemoteAddMessage(["A", "B", "C"], 3)).toBe("3 new items were added to the list.");
  });
});
