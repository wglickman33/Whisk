import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SousPage } from "../../pages/SousPage";
import { useSousStore } from "../../store/sousStore";
import type { SpeechRecognitionLike } from "../../utils/speech";

const chatStream = vi.fn();
const speakText = vi.fn();
const stopSpeaking = vi.fn();
let fakeRec: FakeRec | null = null;

class FakeRec implements SpeechRecognitionLike {
  lang = "";
  interimResults = false;
  continuous = false;
  start = vi.fn();
  stop = vi.fn(() => {
    this.onend?.();
  });
  abort = vi.fn();
  onresult: SpeechRecognitionLike["onresult"] = null;
  onerror: SpeechRecognitionLike["onerror"] = null;
  onend: SpeechRecognitionLike["onend"] = null;
}

vi.mock("../../api/client", () => ({
  sousApi: {
    chatStream: (...args: unknown[]) => chatStream(...args),
  },
  shoppingListsApi: {
    bulkAdd: vi.fn(),
  },
}));

vi.mock("../../store/authModalStore", () => ({
  useAuthModalStore: (selector: (s: { openAuthModal: () => void }) => unknown) =>
    selector({ openAuthModal: vi.fn() }),
}));

vi.mock("../../store/toastStore", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("../tools/SafeMarkdown", () => ({
  SafeMarkdown: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock("../../utils/speech", async () => {
  const actual = await vi.importActual<typeof import("../../utils/speech")>("../../utils/speech");
  return {
    ...actual,
    isSpeechRecognitionSupported: () => true,
    createSpeechRecognition: () => {
      fakeRec = new FakeRec();
      return fakeRec;
    },
    speakText: (...args: unknown[]) => speakText(...args),
    stopSpeaking: (...args: unknown[]) => stopSpeaking(...args),
  };
});

vi.mock("../../store/authStore", () => ({
  useAuthStore: (selector: (s: { isSignedIn: boolean; isLoading: boolean }) => unknown) =>
    selector({ isSignedIn: true, isLoading: false }),
}));

beforeEach(() => {
  fakeRec = null;
  chatStream.mockImplementation(async () => ({ reply: "You have lemon chicken." }));
});

afterEach(() => {
  cleanup();
  chatStream.mockReset();
  speakText.mockReset();
  stopSpeaking.mockReset();
  useSousStore.getState().resetChat();
  useSousStore.getState().closeWidget();
});

describe("Sous voice", () => {
  it("sends a spoken question and reads the reply aloud", async () => {
    render(
      <MemoryRouter>
        <SousPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /talk to sous ai/i }));
    expect(fakeRec?.start).toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/listening/i)).toBeTruthy();

    fakeRec?.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: "What chicken recipes do I have?" } }],
    });

    await waitFor(() => {
      expect(chatStream).toHaveBeenCalledWith(
        [{ role: "user", content: "What chicken recipes do I have?" }],
        expect.any(Function)
      );
      expect(screen.getByText("You have lemon chicken.")).toBeTruthy();
    });
    expect(speakText).toHaveBeenCalledWith("You have lemon chicken.", expect.any(Function));
  });

  it("turns Send into Stop while Sous is speaking", async () => {
    render(
      <MemoryRouter>
        <SousPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /talk to sous ai/i }));
    fakeRec?.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: "Any chicken?" } }],
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /stop speaking/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /stop speaking/i }));
    expect(stopSpeaking).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^send$/i })).toBeTruthy();
  });
});
