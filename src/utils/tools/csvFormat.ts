import { parseCsv, parseCsvLine } from "../../converters/utils/csvParser";

export interface ToolResult {
  ok: boolean;
  output?: string;
  error?: string;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function validateCsv(input: string): ToolResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Paste CSV data first." };
  try {
    const rows = parseCsv(trimmed);
    if (!rows.length) return { ok: false, error: "CSV needs a header row and at least one data row." };
    const headers = Object.keys(rows[0]);
    return {
      ok: true,
      output: `Valid CSV: ${headers.length} column${headers.length === 1 ? "" : "s"}, ${rows.length} row${rows.length === 1 ? "" : "s"}.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid CSV.";
    return { ok: false, error: message };
  }
}

export function csvToJson(input: string): ToolResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Paste CSV data first." };
  try {
    const rows = parseCsv(trimmed);
    if (!rows.length) return { ok: false, error: "CSV needs a header row and at least one data row." };
    return { ok: true, output: JSON.stringify(rows, null, 2) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid CSV.";
    return { ok: false, error: message };
  }
}

export function jsonToCsv(input: string): ToolResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Paste JSON first." };
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      return { ok: false, error: "JSON must be an array of objects." };
    }
    if (!parsed.length) return { ok: false, error: "Array is empty." };
    if (typeof parsed[0] !== "object" || parsed[0] === null || Array.isArray(parsed[0])) {
      return { ok: false, error: "Each item must be an object with column names as keys." };
    }
    const headers = [...new Set(parsed.flatMap((row) => Object.keys(row as object)))];
    const lines = [
      headers.map(escapeCsvField).join(","),
      ...parsed.map((row) =>
        headers.map((h) => escapeCsvField(String((row as Record<string, unknown>)[h] ?? ""))).join(",")
      ),
    ];
    return { ok: true, output: lines.join("\n") };
  } catch (err) {
    const message = err instanceof SyntaxError ? err.message : "Invalid JSON.";
    return { ok: false, error: message };
  }
}

export function formatCsvPreview(input: string): ToolResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Paste CSV data first." };
  try {
    const lines = trimmed.split(/\r?\n/).filter((l) => l.length > 0);
    if (!lines.length) return { ok: false, error: "Nothing to preview." };
    const rows = lines.map(parseCsvLine);
    const colCount = Math.max(...rows.map((r) => r.length));
    const widths = Array.from({ length: colCount }, (_, i) =>
      Math.min(40, Math.max(...rows.map((r) => (r[i] ?? "").length), 3))
    );
    const formatted = rows
      .map((row) =>
        row
          .map((cell, i) => {
            const clipped = cell.length > widths[i] ? cell.slice(0, widths[i] - 1) + "…" : cell;
            return clipped.padEnd(widths[i]);
          })
          .join(" | ")
      )
      .join("\n");
    return { ok: true, output: formatted };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not preview CSV.";
    return { ok: false, error: message };
  }
}
