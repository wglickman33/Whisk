import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  type SpeechRecognitionLike,
} from "../utils/speech";

type UseSousVoiceOptions = {
  enabled: boolean;
  onFinal: (transcript: string) => void;
  onInterim: (transcript: string) => void;
  onError: (message: string) => void;
};

export function useSousVoice({ enabled, onFinal, onInterim, onError }: UseSousVoiceOptions) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  const onErrorRef = useRef(onError);

  onFinalRef.current = onFinal;
  onInterimRef.current = onInterim;
  onErrorRef.current = onError;

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    setListening(false);
    rec?.stop();
  }, []);

  const start = useCallback(() => {
    if (!enabled) return;
    const rec = createSpeechRecognition();
    if (!rec) {
      onErrorRef.current("Voice input isn't available in this browser.");
      return;
    }

    recognitionRef.current?.abort();
    rec.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const piece = result?.[0]?.transcript ?? "";
        if (result.isFinal) finalText += piece;
        else interimText += piece;
      }
      const spoken = (finalText || interimText).trim();
      if (spoken) onInterimRef.current(spoken);
      if (finalText.trim()) {
        onFinalRef.current(finalText.trim());
      }
    };
    rec.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      onErrorRef.current(
        event.error === "not-allowed"
          ? "Microphone access was blocked. Allow it to talk to Sous AI."
          : "Could not hear that. Try again."
      );
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch {
      onErrorRef.current("Could not start the microphone. Try again.");
    }
  }, [enabled]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }, []);

  return {
    supported: isSpeechRecognitionSupported(),
    listening,
    start,
    stop,
    toggle,
  };
}
