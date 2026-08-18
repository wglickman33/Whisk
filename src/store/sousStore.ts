import { create } from "zustand";
import {
  shoppingListsApi,
  sousApi,
  type ShoppingListItemInput,
  type SousChatMessage,
  type SousPendingAddToList,
  type SousStreamEvent,
} from "../api/client";
import { toastError, toastSuccess } from "./toastStore";
import { SHOPPING_LIST_PATH } from "../utils/shoppingListShare";
import { applySousTraceEvent, type SousTraceStep } from "../utils/sousTrace";

export const SOUS_SUGGESTIONS = [
  "What chicken recipes do I have?",
  "What can I use instead of heavy cream?",
  "What's on my shopping list?",
] as const;

export type PendingStatus = "idle" | "adding" | "added" | "dismissed";

export type ChatTurn =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      pendingAction?: SousPendingAddToList;
      pendingStatus?: PendingStatus;
    };

const initialChat = {
  messages: [] as ChatTurn[],
  draft: "",
  sending: false,
  threadError: null as string | null,
  traceSteps: [] as SousTraceStep[],
};

function toApiMessages(turns: ChatTurn[]): SousChatMessage[] {
  return turns.map((turn) => ({ role: turn.role, content: turn.content }));
}

export function formatSousItemLine(item: ShoppingListItemInput): string {
  const qty = item.quantity?.trim();
  return qty ? `${item.name} (${qty})` : item.name;
}

interface SousState {
  widgetOpen: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  messages: ChatTurn[];
  draft: string;
  sending: boolean;
  threadError: string | null;
  traceSteps: SousTraceStep[];
  setDraft: (draft: string) => void;
  send: (raw?: string) => Promise<void>;
  confirmAdd: (index: number) => Promise<void>;
  dismissAdd: (index: number) => void;
  resetChat: () => void;
}

export const useSousStore = create<SousState>((set, get) => ({
  widgetOpen: false,
  openWidget: () => set({ widgetOpen: true }),
  closeWidget: () => set({ widgetOpen: false }),
  ...initialChat,
  setDraft: (draft) => set({ draft }),
  resetChat: () => set({ ...initialChat }),
  send: async (raw) => {
    const { sending, messages, draft } = get();
    const content = (raw ?? draft).trim();
    if (!content || sending) return;

    const dismissed = messages.map((turn) =>
      turn.role === "assistant" && turn.pendingStatus === "idle"
        ? { ...turn, pendingStatus: "dismissed" as const }
        : turn
    );
    const nextMessages: ChatTurn[] = [...dismissed, { role: "user", content }];
    set({
      sending: true,
      draft: "",
      threadError: null,
      traceSteps: [],
      messages: nextMessages,
    });

    try {
      const { reply, pendingAction } = await sousApi.chatStream(
        toApiMessages(nextMessages),
        (event: SousStreamEvent) => {
          set({ traceSteps: applySousTraceEvent(get().traceSteps, event) });
        }
      );
      set({
        messages: [
          ...nextMessages,
          {
            role: "assistant",
            content: reply,
            pendingAction,
            pendingStatus: pendingAction ? "idle" : undefined,
          },
        ],
        sending: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sous could not reply. Try again.";
      toastError(message);
      set({
        threadError: message,
        draft: content,
        messages,
        sending: false,
      });
    }
  },
  confirmAdd: async (index) => {
    const turn = get().messages[index];
    if (turn?.role !== "assistant" || !turn.pendingAction || turn.pendingStatus !== "idle") return;

    set({
      messages: get().messages.map((item, i) =>
        i === index && item.role === "assistant" ? { ...item, pendingStatus: "adding" } : item
      ),
    });

    try {
      const { listId, listName, items } = turn.pendingAction;
      await shoppingListsApi.bulkAdd(listId, items);
      toastSuccess(`Added to "${listName}".`, {
        actionLabel: "View list",
        actionHref: SHOPPING_LIST_PATH,
      });
      set({
        messages: get().messages.map((item, i) =>
          i === index && item.role === "assistant" ? { ...item, pendingStatus: "added" } : item
        ),
      });
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not add those items.");
      set({
        messages: get().messages.map((item, i) =>
          i === index && item.role === "assistant" ? { ...item, pendingStatus: "idle" } : item
        ),
      });
    }
  },
  dismissAdd: (index) => {
    set({
      messages: get().messages.map((item, i) =>
        i === index && item.role === "assistant" ? { ...item, pendingStatus: "dismissed" } : item
      ),
    });
  },
}));
