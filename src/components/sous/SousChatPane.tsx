import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { SafeMarkdown } from "../tools/SafeMarkdown";
import { IconClear, IconMic, IconSend, IconStop, IconSous } from "../ui/SidebarIcons";
import {
  formatSousItemLine,
  SOUS_SUGGESTIONS,
  useSousStore,
} from "../../store/sousStore";
import { SHOPPING_LIST_PATH } from "../../utils/shoppingListShare";
import { speakText, stopSpeaking } from "../../utils/speech";
import { useSousVoice } from "../../hooks/useSousVoice";
import { toastError } from "../../store/toastStore";
import "./SousChatPane.scss";

type SousChatPaneProps = {
  variant: "page" | "widget";
  inputId: string;
};

export function SousChatPane({ variant, inputId }: SousChatPaneProps) {
  const messages = useSousStore((s) => s.messages);
  const draft = useSousStore((s) => s.draft);
  const sending = useSousStore((s) => s.sending);
  const threadError = useSousStore((s) => s.threadError);
  const setDraft = useSousStore((s) => s.setDraft);
  const send = useSousStore((s) => s.send);
  const confirmAdd = useSousStore((s) => s.confirmAdd);
  const dismissAdd = useSousStore((s) => s.dismissAdd);
  const resetChat = useSousStore((s) => s.resetChat);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const compact = variant === "widget";
  const voiceTurnRef = useRef(false);
  const lastSpokenRef = useRef("");
  const [speaking, setSpeaking] = useState(false);

  const { supported: voiceSupported, listening, toggle: toggleVoice, stop: stopVoice } =
    useSousVoice({
      enabled: !sending,
      onInterim: setDraft,
      onFinal: (transcript) => {
        voiceTurnRef.current = true;
        void send(transcript);
      },
      onError: (message) => toastError(message),
    });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending, threadError]);

  useEffect(() => {
    if (sending) stopVoice();
    else inputRef.current?.focus();
  }, [sending, stopVoice]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!voiceTurnRef.current || last?.role !== "assistant" || !last.content) return;
    if (lastSpokenRef.current === last.content) return;
    lastSpokenRef.current = last.content;
    voiceTurnRef.current = false;
    setSpeaking(true);
    speakText(last.content, () => setSpeaking(false));
  }, [messages]);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (messages.length > 0) return;
    stopSpeaking();
    setSpeaking(false);
  }, [messages.length]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    void send();
  };

  const clearChat = () => {
    stopSpeaking();
    setSpeaking(false);
    stopVoice();
    resetChat();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (speaking) {
        stopSpeaking();
        setSpeaking(false);
        return;
      }
      void send();
    }
  };

  return (
    <div className={`sous-chat${compact ? " sous-chat--widget" : ""}`}>
      {messages.length > 0 ? (
        <div className="sous-chat__toolbar">
          <button
            type="button"
            className="sous-chat__clear"
            onClick={clearChat}
            disabled={sending}
          >
            <IconClear />
            Clear chat
          </button>
        </div>
      ) : null}
      <div
        className="sous-chat__thread"
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={sending}
      >
        {messages.length === 0 && !sending && (
          <div className="sous-chat__welcome">
            <span className="sous-chat__welcome-icon" aria-hidden>
              <IconSous />
            </span>
            <p className="sous-chat__welcome-title">What can I help with?</p>
            <p className="sous-chat__welcome-copy">
              Ask about a saved recipe, a substitute, or your shopping list.
            </p>
            <ul className="sous-chat__suggestions">
              {SOUS_SUGGESTIONS.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    className="sous-chat__suggestion"
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
            className={`sous-chat__turn sous-chat__turn--${message.role}`}
          >
            <p className="sous-chat__role">{message.role === "user" ? "You" : "Sous AI"}</p>
            {message.role === "assistant" ? (
              <div className="sous-chat__body">
                <SafeMarkdown>{message.content}</SafeMarkdown>
              </div>
            ) : (
              <p className="sous-chat__body sous-chat__body--plain">{message.content}</p>
            )}
            {message.role === "assistant" &&
              message.pendingAction &&
              message.pendingStatus &&
              message.pendingStatus !== "dismissed" && (
                <div className="sous-chat__confirm">
                  {message.pendingStatus === "added" ? (
                    <p className="sous-chat__confirm-done">
                      Added to {message.pendingAction.listName}.{" "}
                      <Link to={SHOPPING_LIST_PATH}>View list</Link>
                    </p>
                  ) : (
                    <>
                      <p className="sous-chat__confirm-title">
                        Add to {message.pendingAction.listName}?
                      </p>
                      <ul className="sous-chat__confirm-items">
                        {message.pendingAction.items.map((item) => (
                          <li key={`${item.name}-${item.quantity ?? ""}`}>
                            {formatSousItemLine(item)}
                          </li>
                        ))}
                      </ul>
                      <div className="sous-chat__confirm-actions">
                        <button
                          type="button"
                          className="sous-chat__confirm-dismiss"
                          onClick={() => dismissAdd(index)}
                          disabled={message.pendingStatus === "adding"}
                        >
                          Not now
                        </button>
                        <button
                          type="button"
                          className="sous-chat__confirm-add"
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
          <p className="sous-chat__status" role="status">
            <span className="sous-chat__dots" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            Looking that up...
          </p>
        )}
        {threadError && (
          <p className="sous-chat__error" role="alert">
            {threadError}
          </p>
        )}
      </div>

      <form className="sous-chat__composer" onSubmit={onSubmit}>
        <label className="sous-chat__label" htmlFor={inputId}>
          Message
        </label>
        <div className="sous-chat__compose-row">
          <textarea
            id={inputId}
            ref={inputRef}
            className="sous-chat__input"
            rows={compact ? 2 : 3}
            value={draft}
            onChange={(event) => {
              if (speaking) {
                stopSpeaking();
                setSpeaking(false);
              }
              setDraft(event.target.value);
            }}
            onKeyDown={onKeyDown}
            placeholder={
              listening
                ? "Listening..."
                : "Ask about a recipe, a substitute, or your list..."
            }
            disabled={sending || listening}
            maxLength={4000}
          />
          {voiceSupported ? (
            <button
              type="button"
              className={`sous-chat__mic${listening ? " sous-chat__mic--listening" : ""}`}
              onClick={() => {
                if (speaking) {
                  stopSpeaking();
                  setSpeaking(false);
                }
                toggleVoice();
              }}
              disabled={sending}
              aria-pressed={listening}
              aria-label={listening ? "Stop listening" : "Talk to Sous AI"}
            >
              <IconMic />
            </button>
          ) : null}
          <button
            type={speaking ? "button" : "submit"}
            className={`sous-chat__send${speaking ? " sous-chat__send--stop" : ""}`}
            disabled={sending || (!speaking && !draft.trim())}
            aria-label={sending ? "Sending" : speaking ? "Stop speaking" : "Send"}
            onClick={
              speaking
                ? () => {
                    stopSpeaking();
                    setSpeaking(false);
                  }
                : undefined
            }
          >
            {sending ? "Sending..." : speaking ? (compact ? <IconStop /> : "Stop") : compact ? <IconSend /> : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
