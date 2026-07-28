import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DEFAULT_LIST_NAME,
  prepareAddToShoppingList,
  resolvePreferredListId,
} from "./shoppingListActions";
import { shoppingListsApi, type ShoppingList } from "../api/client";
import { SELECTED_LIST_KEY } from "./shoppingListUtils";

vi.mock("../api/client", () => ({
  shoppingListsApi: {
    list: vi.fn(),
    create: vi.fn(),
    bulkAdd: vi.fn(),
  },
}));

const mockList = (id: string, name: string): ShoppingList => ({
  id,
  name,
  ownerUserId: "u1",
  isOwner: true,
  createdAt: "2026-01-01T00:00:00Z",
  members: [{ id: "u1", name: "Will", initial: "W" }],
});

describe("resolvePreferredListId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses stored list id when still valid", () => {
    localStorage.setItem(SELECTED_LIST_KEY, "l2");
    expect(resolvePreferredListId([mockList("l1", "A"), mockList("l2", "B")])).toBe("l2");
  });

  it("falls back to the only list", () => {
    expect(resolvePreferredListId([mockList("l1", "A")])).toBe("l1");
  });

  it("returns null when multiple lists and no stored preference", () => {
    expect(resolvePreferredListId([mockList("l1", "A"), mockList("l2", "B")])).toBeNull();
  });
});

describe("prepareAddToShoppingList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("creates a default list when none exist", async () => {
    vi.mocked(shoppingListsApi.list).mockResolvedValue({ lists: [] });
    vi.mocked(shoppingListsApi.create).mockResolvedValue({ list: mockList("new", DEFAULT_LIST_NAME) });
    vi.mocked(shoppingListsApi.bulkAdd).mockResolvedValue({ items: [] });

    const result = await prepareAddToShoppingList([{ name: "Milk" }]);

    expect(result.status).toBe("added");
    expect(shoppingListsApi.create).toHaveBeenCalledWith(DEFAULT_LIST_NAME);
    expect(localStorage.getItem(SELECTED_LIST_KEY)).toBe("new");
  });

  it("adds directly to the only list", async () => {
    vi.mocked(shoppingListsApi.list).mockResolvedValue({ lists: [mockList("l1", "Home")] });
    vi.mocked(shoppingListsApi.bulkAdd).mockResolvedValue({ items: [] });

    const result = await prepareAddToShoppingList([{ name: "Eggs" }]);

    expect(result).toEqual({ status: "added", listId: "l1", listName: "Home" });
  });

  it("prompts when multiple lists and no stored preference", async () => {
    const lists = [mockList("l1", "A"), mockList("l2", "B")];
    vi.mocked(shoppingListsApi.list).mockResolvedValue({ lists });

    const result = await prepareAddToShoppingList([{ name: "Bread" }]);

    expect(result.status).toBe("pick");
    if (result.status === "pick") {
      expect(result.lists).toHaveLength(2);
    }
  });

  it("uses stored preference for multiple lists", async () => {
    localStorage.setItem(SELECTED_LIST_KEY, "l2");
    vi.mocked(shoppingListsApi.list).mockResolvedValue({
      lists: [mockList("l1", "A"), mockList("l2", "B")],
    });
    vi.mocked(shoppingListsApi.bulkAdd).mockResolvedValue({ items: [] });

    const result = await prepareAddToShoppingList([{ name: "Butter" }]);

    expect(result).toEqual({ status: "added", listId: "l2", listName: "B" });
  });
});
