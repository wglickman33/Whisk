import { useState, useEffect, useRef, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import {
  TIMER_PRESETS,
  parseTimerInput,
  formatTimerDisplay,
  playTimerAlert,
  showTimerNotification,
} from "../../../utils/tools/cookingTimer";
import { toastSuccess } from "../../../store/toastStore";
import "../shared/KitchenTool.scss";

type TimerState = "idle" | "running" | "paused" | "done";

export function TimerPage() {
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [state, setState] = useState<TimerState>("idle");
  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finishTimer = useCallback(() => {
    clearTick();
    endTimeRef.current = null;
    setRemaining(0);
    setState("done");
    playTimerAlert();
    showTimerNotification("Cooking timer");
    toastSuccess("Timer finished!");
    document.title = "Timer done! · Whisk";
  }, [clearTick]);

  const tick = useCallback(() => {
    if (endTimeRef.current === null) return;
    const left = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left <= 0) finishTimer();
  }, [finishTimer]);

  const startTimer = useCallback(
    (totalSeconds: number) => {
      clearTick();
      endTimeRef.current = Date.now() + totalSeconds * 1000;
      setRemaining(totalSeconds);
      setState("running");
      document.title = formatTimerDisplay(totalSeconds);
      intervalRef.current = setInterval(tick, 200);
    },
    [clearTick, tick]
  );

  const handleStart = () => {
    const total = parseTimerInput(minutes, seconds);
    if (total === null) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    startTimer(total);
  };

  const handlePause = () => {
    if (state !== "running") return;
    clearTick();
    setState("paused");
  };

  const handleResume = () => {
    if (state !== "paused" || remaining <= 0) return;
    endTimeRef.current = Date.now() + remaining * 1000;
    setState("running");
    intervalRef.current = setInterval(tick, 200);
  };

  const handleReset = () => {
    clearTick();
    endTimeRef.current = null;
    setRemaining(0);
    setState("idle");
    document.title = "Whisk";
  };

  useEffect(() => {
    return () => {
      clearTick();
      document.title = "Whisk";
    };
  }, [clearTick]);

  useEffect(() => {
    if (state === "running") {
      document.title = `${formatTimerDisplay(remaining)} · Whisk`;
    }
  }, [remaining, state]);

  const activeStep =
    state === "done" ? 2 : state === "running" || state === "paused" ? 2 : minutes > 0 || seconds > 0 ? 1 : 0;

  const displaySeconds = state === "idle" ? parseTimerInput(minutes, seconds) ?? 0 : remaining;

  return (
    <ToolPage
      toolId="timer"
      activeStep={activeStep}
      primaryAction={
        state === "idle"
          ? { label: "Start timer", onClick: handleStart, disabled: parseTimerInput(minutes, seconds) === null }
          : undefined
      }
    >
      <div className="kitchen-tool">
        <div className="kitchen-tool__timer-display" aria-live="polite">
          {formatTimerDisplay(displaySeconds ?? 0)}
        </div>

        {state === "idle" && (
          <>
            <div className="kitchen-tool__row">
              <label className="kitchen-tool__field">
                <span>Minutes</span>
                <input
                  type="number"
                  min={0}
                  max={1440}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))}
                />
              </label>
              <label className="kitchen-tool__field">
                <span>Seconds</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={seconds}
                  onChange={(e) => setSeconds(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                />
              </label>
            </div>

            <div className="kitchen-tool__presets" role="group" aria-label="Quick presets">
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="kitchen-tool__mode"
                  onClick={() => {
                    setMinutes(Math.floor(preset.seconds / 60));
                    setSeconds(preset.seconds % 60);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="kitchen-tool__timer-actions">
          {state === "running" && (
            <button type="button" className="kitchen-tool__btn" onClick={handlePause}>
              Pause
            </button>
          )}
          {state === "paused" && (
            <button type="button" className="kitchen-tool__btn kitchen-tool__btn--primary" onClick={handleResume}>
              Resume
            </button>
          )}
          {(state === "running" || state === "paused" || state === "done") && (
            <button type="button" className="kitchen-tool__btn" onClick={handleReset}>
              Reset
            </button>
          )}
        </div>

        {state === "done" && (
          <p className="kitchen-tool__hint" role="status">
            Time&apos;s up! Check your dish.
          </p>
        )}
      </div>
    </ToolPage>
  );
}
