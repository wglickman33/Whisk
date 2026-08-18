import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import {
  shoppingListsApi,
  sousApi,
  type ShoppingListItemInput,
  type SousChatMessage,
  type SousPendingAddToList,
  type SousStreamEvent,
} from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useAuthModalStore } from "../store/authModalStore";
import { toastError, toastSuccess } from "../store/toastStore";
import { SafeMarkdown } from "../components/tools/SafeMarkdown";
import { IconSous } from "../components/ui/SidebarIcons";
import { SHOPPING_LIST_PATH } from "../utils/shoppingListShare";
import {
  applySousTraceEvent,
  sousToolLabel,
  summarizeSousInput,
  summarizeSousOutput,
  type SousTraceStep,
} from "../utils/sousTrace";
import "./SousPage.scss";

const SUGGESTIONS = [
  "What chicken recipes do I have?",
  "What can I use instead of heavy cream?",
  "What's on my shopping list?",
];

type PendingStatus = "idle" | "adding" | "added" | "dismissed";

type ChatTurn =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      pendingAction?: SousPendingAddToList;
      pendingStatus?: PendingStatus;
    };

function toApiMessages(turns: ChatTurn[]): SousChatMessage[] {
  return turns.map((turn) => ({ role: turn.role, content: turn.content }));
}

function formatItemLine(item: ShoppingListItemInput): string {
  const qty = item.quantity?.trim();
  return qty ? `${item.name} (${qty})` : item.name;
}

export function SousPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [traceSteps, setTraceSteps] = useState<SousTraceStep[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const traceRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending, threadError]);

  useEffect(() => {
    traceRef.current?.scrollTo({ top: traceRef.current.scrollHeight });
  }, [traceSteps]);

  useEffect(() => {
    if (!isLoading && isSignedIn) inputRef.current?.focus();
  }, [isLoading, isSignedIn]);

  const send = async (raw?: string) => {
    const content = (raw ?? draft).trim();
    if (!content || sendingRef.current) return;

    const dismissed = messages.map((turn) =>
      turn.role === "assistant" && turn.pendingStatus === "idle"
        ? { ...turn, pendingStatus: "dismissed" as const }
        : turn
    );
    const nextMessages: ChatTurn[] = [...dismissed, { role: "user", content }];
    sendingRef.current = true;
    setSending(true);
    setDraft("");
    setThreadError(null);
    setTraceSteps([]);
    setMessages(nextMessages);

    try {
      const { reply, pendingAction } = await sousApi.chatStream(
        toApiMessages(nextMessages),
        (event: SousStreamEvent) => {
          setTraceSteps((prev) => applySousTraceEvent(prev, event));
        }
      );
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: reply,
          pendingAction,
          pendingStatus: pendingAction ? "idle" : undefined,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sous could not reply. Try again.";
      setThreadError(message);
      toastError(message);
      setDraft(content);
      setMessages(messages);
    } finally {
      sendingRef.current = false;
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  const confirmAdd = async (index: number) => {
    const turn = messages[index];
    if (turn?.role !== "assistant" || !turn.pendingAction || turn.pendingStatus !== "idle") return;

    setMessages((prev) =>
      prev.map((item, i) =>
        i === index && item.role === "assistant" ? { ...item, pendingStatus: "adding" } : item
      )
    );

    try {
      const { listId, listName, items } = turn.pendingAction;
      await shoppingListsApi.bulkAdd(listId, items);
      toastSuccess(`Added to "${listName}".`, {
        actionLabel: "View list",
        actionHref: SHOPPING_LIST_PATH,
      });
      setMessages((prev) =>
        prev.map((item, i) =>
          i === index && item.role === "assistant" ? { ...item, pendingStatus: "added" } : item
        )
      );
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not add those items.");
      setMessages((prev) =>
        prev.map((item, i) =>
          i === index && item.role === "assistant" ? { ...item, pendingStatus: "idle" } : item
        )
      );
    }
  };

  const dismissAdd = (index: number) => {
    setMessages((prev) =>
      prev.map((item, i) =>
        i === index && item.role === "assistant" ? { ...item, pendingStatus: "dismissed" } : item
      )
    );
  };

  if (!isLoading && !isSignedIn) {
    return (
      <div className="sous-page">
        <header className="sous-page__header">
          <h1>Sous</h1>
        </header>
        <div className="sous-page__guest-overlay">
          <div className="sous-page__guest-center">
            <div className="sous-page__guest">
              <span className="sous-page__guest-icon" aria-hidden>
                <IconSous />
              </span>
              <p className="sous-page__guest-text">Sign in to chat with Sous.</p>
              <p className="sous-page__guest-sub">
                Recipes, substitutions, and shopping lists, private to your account.
              </p>
              <button type="button" className="sous-page__cta" onClick={() => openAuthModal("login")}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sous-page">
      <header className="sous-page__header">
        <h1>Sous</h1>
        <p>Your kitchen assistant. Ask about saved recipes, substitutions, or your shopping list.</p>
      </header>

      <div className="sous-page__workspace">
          <div
            className="sous-page__thread"
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={sending}
          >
            {messages.length === 0 && !sending && (
              <div className="sous-page__welcome">
                <p className="sous-page__empty">Try one of these, or type your own question.</p>
                <ul className="sous-page__suggestions">
                  {SUGGESTIONS.map((prompt) => (
                    <li key={prompt}>
                      <button
                        type="button"
                        className="sous-page__suggestion"
                        onClick={() => void send(prompt)}
                        disabled={sending}
                      >
                        {prompt}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`sous-page__turn sous-page__turn--${message.role}`}
              >
                <p className="sous-page__role">{message.role === "user" ? "You" : "Sous"}</p>
                {message.role === "assistant" ? (
                  <div className="sous-page__body">
                    <SafeMarkdown>{message.content}</SafeMarkdown>
                  </div>
                ) : (
                  <p className="sous-page__body sous-page__body--plain">{message.content}</p>
                )}
                {message.role === "assistant" &&
                  message.pendingAction &&
                  message.pendingStatus &&
                  message.pendingStatus !== "dismissed" && (
                    <div className="sous-page__confirm">
                      {message.pendingStatus === "added" ? (
                        <p className="sous-page__confirm-done">
                          Added to {message.pendingAction.listName}.{" "}
                          <Link to={SHOPPING_LIST_PATH}>View list</Link>
                        </p>
                      ) : (
                        <>
                          <p className="sous-page__confirm-title">
                            Add to {message.pendingAction.listName}?
                          </p>
                          <ul className="sous-page__confirm-items">
                            {message.pendingAction.items.map((item) => (
                              <li key={`${item.name}-${item.quantity ?? ""}`}>
                                {formatItemLine(item)}
                              </li>
                            ))}
                          </ul>
                          <div className="sous-page__confirm-actions">
                            <button
                              type="button"
                              className="sous-page__confirm-dismiss"
                              onClick={() => dismissAdd(index)}
                              disabled={message.pendingStatus === "adding"}
                            >
                              Not now
                            </button>
                            <button
                              type="button"
                              className="sous-page__confirm-add"
                              onClick={() => void confirmAdd(index)}
                              disabled={message.pendingStatus === "adding"}
                            >
                              {message.pendingStatus === "adding" ? "Adding..." : "Add to list"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
              </article>
            ))}
            {sending && (
              <p className="sous-page__status" role="status">
                <span className="sous-page__dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                Looking that up...
              </p>
            )}
            {threadError && (
              <p className="sous-page__error" role="alert">
                {threadError}
              </p>
            )}
          </div>

          <aside className="sous-page__trace" aria-label="Sous lookups">
          <div className="sous-page__trace-head">
            <h2>Lookups</h2>
            <p>What Sous is checking, as it happens.</p>
          </div>
          <div className="sous-page__trace-body" ref={traceRef} aria-live="polite">
            {traceSteps.length === 0 ? (
              <p className="sous-page__trace-empty">
                {sending
                  ? "Starting lookup..."
                  : "Recipe, substitute, and list lookups will show up here."}
              </p>
            ) : (
              <ol className="sous-page__steps">
                {traceSteps.map((step) => {
                  const detail =
                    step.status === "done"
                      ? summarizeSousOutput(step.name, step.output)
                      : summarizeSousInput(step.name, step.input);
                  return (
                    <li
                      key={step.id}
                      className={`sous-page__step ${
                        step.status === "running" ? "sous-page__step--running" : ""
                      }`}
                    >
                      <p className="sous-page__step-label">{sousToolLabel(step.name)}</p>
                      {detail ? <p className="sous-page__step-detail">{detail}</p> : null}
                      {step.status === "running" ? (
                        <p className="sous-page__step-status">Working...</p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </aside>

        <form className="sous-page__composer" onSubmit={onSubmit}>
          <label className="sous-page__label" htmlFor="sous-message">
            Message
          </label>
          <textarea
            id="sous-message"
            ref={inputRef}
            className="sous-page__input"
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about a recipe, a substitute, or your list..."
            disabled={sending}
            maxLength={4000}
          />
          <button
            type="submit"
            className="sous-page__send"
            disabled={sending || !draft.trim()}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
