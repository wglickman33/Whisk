import type { Response } from "express";

export type ShoppingListStreamEvent =
  | {
      type: "item.created";
      listId: string;
      listName: string;
      actorUserId: string;
      item: Record<string, unknown>;
    }
  | {
      type: "item.updated";
      listId: string;
      listName: string;
      actorUserId: string;
      item: Record<string, unknown>;
    }
  | {
      type: "item.deleted";
      listId: string;
      listName: string;
      actorUserId: string;
      itemId: string;
    }
  | {
      type: "items.bulk_created";
      listId: string;
      listName: string;
      actorUserId: string;
      items: Record<string, unknown>[];
    }
  | {
      type: "items.cleared";
      listId: string;
      listName: string;
      actorUserId: string;
    }
  | {
      type: "list.updated";
      listId: string;
      listName: string;
      actorUserId: string;
    };

export type ShoppingListEventPayload =
  | { type: "item.created"; item: Record<string, unknown> }
  | { type: "item.updated"; item: Record<string, unknown> }
  | { type: "item.deleted"; itemId: string }
  | { type: "items.bulk_created"; items: Record<string, unknown>[] }
  | { type: "items.cleared" }
  | { type: "list.updated" };

interface StreamClient {
  res: Response;
  userId: string;
}

const listClients = new Map<string, Set<StreamClient>>();
const userConnections = new Map<string, Set<Response>>();

function writeEvent(res: Response, event: ShoppingListStreamEvent): void {
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function isSubscribed(listId: string, res: Response): boolean {
  const clients = listClients.get(listId);
  if (!clients) return false;
  for (const client of clients) {
    if (client.res === res) return true;
  }
  return false;
}

export function subscribeToListEvents(
  listId: string,
  userId: string,
  res: Response
): void {
  if (isSubscribed(listId, res)) return;

  let clients = listClients.get(listId);
  if (!clients) {
    clients = new Set();
    listClients.set(listId, clients);
  }
  clients.add({ res, userId });
}

export function unsubscribeFromListEvents(listId: string, res: Response): void {
  const clients = listClients.get(listId);
  if (!clients) return;
  for (const client of clients) {
    if (client.res === res) clients.delete(client);
  }
  if (clients.size === 0) listClients.delete(listId);
}

export function registerStreamConnection(
  userId: string,
  res: Response,
  listIds: string[]
): void {
  let connections = userConnections.get(userId);
  if (!connections) {
    connections = new Set();
    userConnections.set(userId, connections);
  }
  connections.add(res);

  for (const listId of listIds) {
    subscribeToListEvents(listId, userId, res);
  }
}

export function unregisterStreamConnection(
  userId: string,
  res: Response,
  listIds: string[]
): void {
  for (const listId of listIds) {
    unsubscribeFromListEvents(listId, res);
  }

  const connections = userConnections.get(userId);
  if (!connections) return;
  connections.delete(res);
  if (connections.size === 0) userConnections.delete(userId);
}

export function subscribeUserToList(userId: string, listId: string): void {
  const connections = userConnections.get(userId);
  if (!connections) return;
  for (const res of connections) {
    subscribeToListEvents(listId, userId, res);
  }
}

export function unsubscribeUserFromList(userId: string, listId: string): void {
  const connections = userConnections.get(userId);
  if (!connections) return;
  for (const res of connections) {
    unsubscribeFromListEvents(listId, res);
  }
}

export function broadcastListEvent(event: ShoppingListStreamEvent): void {
  const clients = listClients.get(event.listId);
  if (!clients) return;
  for (const client of clients) {
    try {
      writeEvent(client.res, event);
    } catch {
      clients.delete(client);
    }
  }
}
