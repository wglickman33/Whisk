import type { ConversionHandler, FileData } from "../core/types";
import { swapExtension } from "../utils/fileUtils";

const DATA_FORMATS = ["json", "csv", "xml", "yaml", "toml"];

const DATA_MIME: Record<string, string> = {
  json: "application/json",
  csv:  "text/csv",
  xml:  "application/xml",
  yaml: "text/yaml",
  toml: "text/toml",
};

function parseInput(text: string, format: string): Record<string, unknown>[] {
  switch (format) {
    case "json": {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    case "csv": {
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim());
      return lines.slice(1).map((line) => {
        const values = line.split(",");
        return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim()]));
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
    case "yaml":
    case "toml":
      throw new Error(`Parsing ${format} requires a library. Install 'js-yaml' or '@iarna/toml'.`);
    default:
      throw new Error(`Unsupported input format: ${format}`);
  }
}

function serializeOutput(data: Record<string, unknown>[], format: string): string {
  switch (format) {
    case "json":
      return JSON.stringify(data.length === 1 ? data[0] : data, null, 2);

    case "csv": {
      if (!data.length) return "";
      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((h) => String(row[h] ?? "")).join(","));
      return [headers.join(","), ...rows].join("\n");
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

    case "yaml": {
      const lines = data.map((row) =>
        Object.entries(row)
          .map(([k, v]) => `  ${k}: ${v}`)
          .join("\n")
      );
      return lines.map((block) => `- \n${block}`).join("\n");
    }

    case "toml": {
      return data
        .map((row) =>
          `[[item]]\n` +
          Object.entries(row)
            .map(([k, v]) => `${k} = "${v}"`)
            .join("\n")
        )
        .join("\n\n");
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
    return DATA_FORMATS.includes(from) && DATA_FORMATS.includes(to) && from !== to;
  }

  async convert(file: FileData, outputFormat: string): Promise<FileData> {
    const decoder = new TextDecoder();
    const text = decoder.decode(file.buffer);
    const parsed = parseInput(text, file.extension);
    const serialized = serializeOutput(parsed, outputFormat);
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
