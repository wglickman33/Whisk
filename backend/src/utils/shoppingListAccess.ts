import { prisma } from "../lib/prisma.js";

const memberUserSelect = {
  id: true,
  name: true,
  email: true,
} as const;

export async function getListIfMember(listId: string, userId: string) {
  return prisma.shoppingList.findFirst({
    where: {
      id: listId,
      OR: [{ ownerUserId: userId }, { members: { some: { userId } } }],
    },
  });
}

export async function getListWithMembers(listId: string, userId: string) {
  return prisma.shoppingList.findFirst({
    where: {
      id: listId,
      OR: [{ ownerUserId: userId }, { members: { some: { userId } } }],
    },
    include: {
      owner: { select: memberUserSelect },
      members: { include: { user: { select: memberUserSelect } } },
    },
  });
}

export function displayName(user: { name: string | null; email: string }): string {
  const trimmed = user.name?.trim();
  if (trimmed) return trimmed;
  return user.email.split("@")[0] ?? user.email;
}
