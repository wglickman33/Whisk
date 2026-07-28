export interface ToolResult {
  ok: boolean;
  output?: string;
  error?: string;
}

export interface TimestampInfo {
  unixSeconds: number;
  unixMillis: number;
  iso: string;
  utc: string;
  local: string;
}

const MAX_INPUT_LENGTH = 64;

export function fromUnix(input: string, useMillis = false): ToolResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Enter a Unix timestamp." };
  if (trimmed.length > MAX_INPUT_LENGTH) return { ok: false, error: "Timestamp too long." };

  const num = Number(trimmed);
  if (!Number.isFinite(num)) return { ok: false, error: "Timestamp must be a number." };

  const ms = useMillis ? num : num * 1000;
  if (Math.abs(ms) > 8.64e15) return { ok: false, error: "Timestamp out of range." };

  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "Invalid timestamp." };

  return { ok: true, output: formatTimestampInfo(date).local };
}

export function toUnix(input: string): ToolResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Enter a date or time." };
  if (trimmed.length > MAX_INPUT_LENGTH) return { ok: false, error: "Input too long." };

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Could not parse that date. Try ISO format like 2026-07-28T12:00:00." };
  }

  const info = formatTimestampInfo(date);
  return {
    ok: true,
    output: `Seconds: ${info.unixSeconds}\nMilliseconds: ${info.unixMillis}\nISO: ${info.iso}`,
  };
}

export function formatTimestampInfo(date: Date): TimestampInfo {
  return {
    unixSeconds: Math.floor(date.getTime() / 1000),
    unixMillis: date.getTime(),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(undefined, {
      dateStyle: "full",
      timeStyle: "long",
    }),
  };
}

export function nowTimestampInfo(): TimestampInfo {
  return formatTimestampInfo(new Date());
}
