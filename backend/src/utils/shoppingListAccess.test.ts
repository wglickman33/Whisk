import { describe, it, expect } from "vitest";
import { displayName } from "./shoppingListAccess.js";
import { serializeItem, serializeList, serializeMember } from "./shoppingListSerialize.js";

describe("displayName", () => {
  it("prefers user name", () => {
    expect(displayName({ name: "Will", email: "w@example.com" })).toBe("Will");
  });

  it("falls back to email local part", () => {
    expect(displayName({ name: null, email: "yael@example.com" })).toBe("yael");
  });
});

describe("serializeMember", () => {
  it("includes initial from display name", () => {
    expect(serializeMember({ id: "1", name: "Yael", email: "y@x.com" })).toEqual({
      id: "1",
      name: "Yael",
      initial: "Y",
    });
  });
});

describe("serializeList", () => {
  it("deduplicates owner and members", () => {
    const owner = { id: "u1", name: "Will", email: "w@x.com" };
    const serialized = serializeList(
      {
        id: "l1",
        name: "Groceries",
        ownerUserId: "u1",
        shareCode: "ABC12345",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        owner,
        members: [{ user: owner }],
      },
      "u1"
    );

    expect(serialized.isOwner).toBe(true);
    expect(serialized.members).toHaveLength(1);
    expect(serialized.shareCode).toBe("ABC12345");
  });
});

describe("serializeItem", () => {
  it("maps nullable fields to undefined", () => {
    const item = serializeItem({
      id: "i1",
      name: "Milk",
      category: null,
      quantity: "2 cups",
      note: null,
      checked: false,
      addedByUserId: "u1",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      addedBy: { id: "u1", name: "Will", email: "w@x.com" },
    });

    expect(item.category).toBeUndefined();
    expect(item.quantity).toBe("2 cups");
    expect(item.addedByName).toBe("Will");
  });
});
