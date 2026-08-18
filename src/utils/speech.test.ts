import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  plainTextForSpeech,
  speakText,
  stopSpeaking,
} from "./speech";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("plainTextForSpeech", () => {
  it("strips markdown so replies can be spoken", () => {
    expect(plainTextForSpeech("Use **oat milk** instead of [cream](https://example.com).")).toBe(
      "Use oat milk instead of cream."
    );
  });
});

describe("speech recognition helpers", () => {
  it("reports unsupported when no constructor exists", () => {
    vi.stubGlobal("window", { ...window, SpeechRecognition: undefined, webkitSpeechRecognition: undefined });
    expect(isSpeechRecognitionSupported()).toBe(false);
    expect(createSpeechRecognition()).toBeNull();
  });

  it("creates a recognizer when the browser provides one", () => {
    const start = vi.fn();
    class FakeRec {
      start = start;
    }
    vi.stubGlobal("webkitSpeechRecognition", FakeRec);
    expect(isSpeechRecognitionSupported()).toBe(true);
    expect(createSpeechRecognition()).toBeInstanceOf(FakeRec);
  });
});

describe("speakText", () => {
  it("speaks plain text and can be cancelled", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      text = "";
      rate = 1;
      constructor(text: string) {
        this.text = text;
      }
    });

    speakText("**Hello** there");
    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalled();
    expect(speak.mock.calls[0][0].text).toBe("Hello there");

    const onEnd = vi.fn();
    speakText("Again", onEnd);
    stopSpeaking();
    expect(onEnd).toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledTimes(3);
  });
});
