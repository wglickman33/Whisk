import { load, dump } from "js-yaml";

export interface ToolResult {
  ok: boolean;
  output?: string;
  error?: string;
}

export function yamlToJson(input: string): ToolResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Paste some YAML first." };
  try {
    const parsed = load(trimmed);
    return { ok: true, output: JSON.stringify(parsed, null, 2) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid YAML.";
    return { ok: false, error: message };
  }
}

export function jsonToYaml(input: string): ToolResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Paste some JSON first." };
  try {
    const parsed = JSON.parse(trimmed);
    return { ok: true, output: dump(parsed, { lineWidth: 120, noRefs: true }) };
  } catch (err) {
    const message = err instanceof SyntaxError ? err.message : "Invalid JSON.";
    return { ok: false, error: message };
  }
}
