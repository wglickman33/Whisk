export interface TimerPreset {
  id: string;
  label: string;
  seconds: number;
}

export const TIMER_PRESETS: TimerPreset[] = [
  { id: "5m", label: "5 min", seconds: 5 * 60 },
  { id: "10m", label: "10 min", seconds: 10 * 60 },
  { id: "15m", label: "15 min", seconds: 15 * 60 },
  { id: "20m", label: "20 min", seconds: 20 * 60 },
  { id: "30m", label: "30 min", seconds: 30 * 60 },
  { id: "45m", label: "45 min", seconds: 45 * 60 },
  { id: "1h", label: "1 hour", seconds: 60 * 60 },
];

export function parseTimerInput(minutes: number, seconds: number): number | null {
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  if (minutes < 0 || seconds < 0 || seconds >= 60) return null;
  const total = Math.floor(minutes) * 60 + Math.floor(seconds);
  if (total <= 0) return null;
  if (total > 24 * 60 * 60) return null;
  return total;
}

export function formatTimerDisplay(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function playTimerAlert(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.25);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 660;
    gain2.gain.value = 0.15;
    osc2.start(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio may be blocked until user gesture; silent fallback is fine.
  }
}

export function showTimerNotification(label: string): void {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification("Timer done!", { body: label || "Your cooking timer finished." });
  }
}
