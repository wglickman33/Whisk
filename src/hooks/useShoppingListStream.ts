import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { useShoppingActivityStore } from "../store/shoppingActivityStore";
import {
  useShoppingListRealtimeStore,
  type ShoppingListStreamEvent,
} from "../store/shoppingListRealtimeStore";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const STREAM_EVENTS: ShoppingListStreamEvent["type"][] = [
  "item.created",
  "item.updated",
  "item.deleted",
  "items.bulk_created",
  "items.cleared",
  "list.updated",
];

function parseStreamEvent(raw: string): ShoppingListStreamEvent | null {
  try {
    return JSON.parse(raw) as ShoppingListStreamEvent;
  } catch {
    return null;
  }
}

/** Live shopping list updates via SSE (replaces polling). */
export function useShoppingListStream(): void {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const userId = useAuthStore((s) => s.user?.id);
  const publish = useShoppingListRealtimeStore((s) => s.publish);
  const ingestStreamEvent = useShoppingActivityStore((s) => s.ingestStreamEvent);
  const baselineSync = useShoppingActivityStore((s) => s.sync);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isSignedIn || isLoading || !userId) return;

    void baselineSync(userId);

    const token = localStorage.getItem("whisk_token");
    if (!token) return;

    const params = new URLSearchParams({ token });
    const source = new EventSource(`${API_URL}/api/shopping-lists/stream?${params.toString()}`);
    sourceRef.current = source;

    for (const type of STREAM_EVENTS) {
      source.addEventListener(type, (message) => {
        const event = parseStreamEvent(message.data);
        if (!event) return;
        publish(event);
        ingestStreamEvent(event, userId);
      });
    }

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [isSignedIn, isLoading, userId, publish, ingestStreamEvent, baselineSync]);
}
