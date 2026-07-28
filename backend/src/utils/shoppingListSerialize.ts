import { displayName } from "./shoppingListAccess.js";

export function serializeMember(user: { id: string; name: string | null; email: string }) {
  const name = displayName(user);
  return {
    id: user.id,
    name,
    initial: name.charAt(0).toUpperCase(),
  };
}

export function serializeList(
  list: {
    id: string;
    name: string;
    ownerUserId: string;
    shareCode: string | null;
    createdAt: Date;
    owner: { id: string; name: string | null; email: string };
    members: { user: { id: string; name: string | null; email: string } }[];
  },
  currentUserId: string
) {
  const memberMap = new Map<string, ReturnType<typeof serializeMember>>();
  memberMap.set(list.owner.id, serializeMember(list.owner));
  for (const row of list.members) {
    memberMap.set(row.user.id, serializeMember(row.user));
  }

  return {
    id: list.id,
    name: list.name,
    ownerUserId: list.ownerUserId,
    isOwner: list.ownerUserId === currentUserId,
    shareCode: list.shareCode ?? undefined,
    createdAt: list.createdAt.toISOString(),
    members: [...memberMap.values()],
  };
}

export function serializeItem(item: {
  id: string;
  name: string;
  category: string | null;
  quantity: string | null;
  note: string | null;
  checked: boolean;
  addedByUserId: string;
  createdAt: Date;
  addedBy: { id: string; name: string | null; email: string };
}) {
  return {
    id: item.id,
    name: item.name,
    category: item.category ?? undefined,
    quantity: item.quantity ?? undefined,
    note: item.note ?? undefined,
    checked: item.checked,
    addedByUserId: item.addedByUserId,
    addedByName: displayName(item.addedBy),
    createdAt: item.createdAt.toISOString(),
  };
}
