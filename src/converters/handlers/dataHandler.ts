import type { ConversionHandler, FileData } from "../core/types";
import { swapExtension } from "../utils/fileUtils";
import { parseCsv } from "../utils/csvParser";
import { createPdfFromRows } from "../utils/pdfUtils";
import { load, dump } from "js-yaml";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import * as XLSX from "xlsx";

const DATA_FORMATS = ["json", "ndjson", "csv", "tsv", "xml", "yaml", "toml", "xlsx", "xls"];
const TABULAR_TO_PDF = ["csv", "tsv", "xlsx", "xls"];

const DATA_MIME: Record<string, string> = {
  json:   "application/json",
  ndjson: "application/x-ndjson",
  csv:    "text/csv",
  tsv:    "text/tab-separated-values",
  xml:    "application/xml",
  yaml:   "text/yaml",
  yml:    "text/yaml",
  toml:   "text/toml",
  xlsx:   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls:    "application/vnd.ms-excel",
};

type Row = Record<string, unknown>;

function normalizeFormat(ext: string): string {
  if (ext === "yml") return "yaml";
  return ext;
}

function rowsFromXlsx(buffer: Uint8Array): Row[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  return XLSX.utils.sheet_to_json<Row>(workbook.Sheets[sheetName], { defval: "" });
}

function parseInput(text: string, format: string, buffer: Uint8Array): Row[] {
  const fmt = normalizeFormat(format);

  switch (fmt) {
    case "json": {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [parsed as Row];
    }
    case "ndjson":
      return text
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Row);
    case "csv":
      return parseCsv(text);
    case "tsv": {
      const lines = text.trim().split("\n");
      if (!lines.length) return [];
      const headers = lines[0].split("\t").map((h) => h.trim());
      return lines.slice(1).map((line) => {
        const values = line.split("\t");
        return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? ""]));
      });
    }
    case "xml": {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "application/xml");
      const root = doc.documentElement;
      return Array.from(root.children).map((el) =>
        Object.fromEntries(
          Array.from(el.children).map((child) => [child.tagName, child.textContent ?? ""])
        )
      );
    }
    case "yaml": {
      const parsed = load(text);
      if (Array.isArray(parsed)) return parsed as Row[];
      if (parsed && typeof parsed === "object") return [parsed as Row];
      return [{ value: parsed }];
    }
    case "toml": {
      const parsed = parseToml(text) as Row | Row[];
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    case "xlsx":
    case "xls":
      return rowsFromXlsx(buffer);
    default:
      throw new Error(`Unsupported input format: ${format}`);
  }
}

function serializeOutput(data: Row[], format: string): string | Uint8Array {
  const fmt = normalizeFormat(format);

  switch (fmt) {
    case "json":
      return JSON.stringify(data.length === 1 ? data[0] : data, null, 2);

    case "ndjson":
      return data.map((row) => JSON.stringify(row)).join("\n");

    case "csv": {
      if (!data.length) return "";
      const headers = [...new Set(data.flatMap((row) => Object.keys(row)))];
      const rows = data.map((row) => headers.map((h) => String(row[h] ?? "")).join(","));
      return [headers.join(","), ...rows].join("\n");
    }

    case "tsv": {
      if (!data.length) return "";
      const headers = [...new Set(data.flatMap((row) => Object.keys(row)))];
      const rows = data.map((row) => headers.map((h) => String(row[h] ?? "")).join("\t"));
      return [headers.join("\t"), ...rows].join("\n");
    }

    case "xml": {
      const rows = data
        .map((row) => {
          const fields = Object.entries(row)
            .map(([k, v]) => `    <${k}>${v}</${k}>`)
            .join("\n");
          return `  <item>\n${fields}\n  </item>`;
        })
        .join("\n");
      return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${rows}\n</root>`;
    }

    case "yaml":
      return dump(data.length === 1 ? data[0] : data);

    case "toml":
      return data.length === 1
        ? stringifyToml(data[0] as Record<string, unknown>)
        : data.map((row) => stringifyToml(row as Record<string, unknown>)).join("\n\n");

    case "xlsx":
    case "xls": {
      const sheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
      return XLSX.write(workbook, { type: "array", bookType: fmt === "xls" ? "xls" : "xlsx" });
    }

    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
}

class DataHandler implements ConversionHandler {
  public name = "data";
  public ready = false;

  async init(): Promise<void> {
    this.ready = true;
  }

  canConvert(from: string, to: string): boolean {
    const f = normalizeFormat(from.toLowerCase());
    const t = normalizeFormat(to.toLowerCase());
    if (f === t) return false;
    if (t === "pdf" && TABULAR_TO_PDF.includes(f)) return true;
    return DATA_FORMATS.includes(f) && DATA_FORMATS.includes(t);
  }

  async convert(file: FileData, outputFormat: string): Promise<FileData> {
    const decoder = new TextDecoder();
    const text = decoder.decode(file.buffer);
    const parsed = parseInput(text, file.extension, file.buffer);

    if (normalizeFormat(outputFormat.toLowerCase()) === "pdf") {
      return createPdfFromRows(file, parsed, file.name.replace(/\.[^.]+$/, ""));
    }

    const serialized = serializeOutput(parsed, outputFormat);

    if (serialized instanceof Uint8Array) {
      return {
        name: swapExtension(file.name, outputFormat),
        buffer: serialized,
        mimeType: DATA_MIME[outputFormat] ?? "application/octet-stream",
        extension: outputFormat,
      };
    }

    const encoder = new TextEncoder();
    return {
      name: swapExtension(file.name, outputFormat),
      buffer: encoder.encode(serialized),
      mimeType: DATA_MIME[outputFormat] ?? "text/plain",
      extension: outputFormat,
    };
  }
}

export default DataHandler;
