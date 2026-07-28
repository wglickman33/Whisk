export interface JsonFormatResult {
  ok: boolean;
  output?: string;
  error?: string;
}

export function formatJson(input: string, indent = 2): JsonFormatResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste some JSON first." };
  }
  try {
    const parsed = JSON.parse(trimmed);
    return { ok: true, output: JSON.stringify(parsed, null, indent) };
  } catch (err) {
    const message = err instanceof SyntaxError ? err.message : "Invalid JSON.";
    return { ok: false, error: message };
  }
}

export function minifyJson(input: string): JsonFormatResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste some JSON first." };
  }
  try {
    const parsed = JSON.parse(trimmed);
    return { ok: true, output: JSON.stringify(parsed) };
  } catch (err) {
    const message = err instanceof SyntaxError ? err.message : "Invalid JSON.";
    return { ok: false, error: message };
  }
}
