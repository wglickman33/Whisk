import type { ConversionHandler, FileData } from "../core/types";
import { swapExtension } from "../utils/fileUtils";

const DOCUMENT_FORMATS = ["txt", "md", "html", "rtf"];

const DOC_MIME: Record<string, string> = {
  txt:  "text/plain",
  md:   "text/markdown",
  html: "text/html",
  rtf:  "application/rtf",
};

function toHtml(text: string, from: string): string {
  if (from === "html") return text;
  if (from === "md") {
    // Basic markdown → HTML (install 'marked' for full support)
    return text
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>");
  }
  // Plain text → wrap paragraphs
  return `<pre>${text}</pre>`;
}

function fromHtml(html: string, to: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const plain = doc.body.innerText ?? doc.body.textContent ?? "";
  if (to === "txt") return plain;
  if (to === "md") {
    // Basic HTML → Markdown
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n")
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
      .replace(/<[^>]+>/g, "")
      .trim();
  }
  return plain;
}

class DocumentHandler implements ConversionHandler {
  public name = "document";
  public ready = false;

  async init(): Promise<void> {
    this.ready = true;
  }

  canConvert(from: string, to: string): boolean {
    return DOCUMENT_FORMATS.includes(from) && DOCUMENT_FORMATS.includes(to) && from !== to;
  }

  async convert(file: FileData, outputFormat: string): Promise<FileData> {
    const decoder = new TextDecoder();
    const text = decoder.decode(file.buffer);

    let output: string;

    if (outputFormat === "html") {
      output = toHtml(text, file.extension);
    } else if (file.extension === "html") {
      output = fromHtml(text, outputFormat);
    } else {
      // txt ↔ md: just pass through with minimal transforms
      output = text;
    }

    const encoder = new TextEncoder();

    return {
      name: swapExtension(file.name, outputFormat),
      buffer: encoder.encode(output),
      mimeType: DOC_MIME[outputFormat] ?? "text/plain",
      extension: outputFormat,
    };
  }
}

export default DocumentHandler;
