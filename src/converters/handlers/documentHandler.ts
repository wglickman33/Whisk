import type { ConversionHandler, FileData } from "../core/types";
import { swapExtension } from "../utils/fileUtils";
import { createPdfFromText, extractPdfText } from "../utils/pdfUtils";
import {
  convertPdfToImages,
  wrapPdfTextAsHtml,
  type PdfImageFormat,
} from "../utils/pdfToImage";
import { marked } from "marked";

const TEXT_FORMATS = ["txt", "md", "html", "htm", "rtf"];
const PDF_IMAGE_OUTPUTS: PdfImageFormat[] = ["png", "jpg", "webp"];

const DOC_MIME: Record<string, string> = {
  txt:  "text/plain",
  md:   "text/markdown",
  html: "text/html",
  htm:  "text/html",
  rtf:  "application/rtf",
  pdf:  "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  zip:  "application/zip",
};

function normalizeDocExt(ext: string): string {
  if (ext === "htm") return "html";
  return ext;
}

async function extractDocxText(file: FileData): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: file.buffer.slice().buffer });
  return result.value.trim();
}

async function extractDocxHtml(file: FileData): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ arrayBuffer: file.buffer.slice().buffer });
  return result.value;
}

async function readAsText(file: FileData): Promise<string> {
  const ext = normalizeDocExt(file.extension.toLowerCase());
  if (ext === "pdf") return extractPdfText(file);
  if (ext === "docx") return extractDocxText(file);
  return new TextDecoder().decode(file.buffer);
}

async function toHtml(text: string, from: string): Promise<string> {
  const ext = normalizeDocExt(from);
  if (ext === "html") return text;
  if (ext === "md") return marked.parse(text) as string;
  return `<pre>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
}

function fromHtml(html: string, to: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const plain = doc.body.innerText ?? doc.body.textContent ?? "";
  if (to === "txt" || to === "rtf") return plain;
  if (to === "md") {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
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
    const f = normalizeDocExt(from.toLowerCase());
    const t = normalizeDocExt(to.toLowerCase());
    if (f === t) return false;

    if (f === "pdf") {
      return ["txt", "html", ...PDF_IMAGE_OUTPUTS].includes(t);
    }

    if (f === "docx") return ["txt", "md", "html", "pdf"].includes(t);
    if (TEXT_FORMATS.includes(f)) {
      if (t === "pdf") return f !== "rtf";
      return TEXT_FORMATS.map(normalizeDocExt).includes(t);
    }
    return false;
  }

  async convert(file: FileData, outputFormat: string): Promise<FileData> {
    const fromExt = normalizeDocExt(file.extension.toLowerCase());
    const toExt = normalizeDocExt(outputFormat.toLowerCase());

    if (fromExt === "pdf" && PDF_IMAGE_OUTPUTS.includes(toExt as PdfImageFormat)) {
      return convertPdfToImages(file, toExt as PdfImageFormat);
    }

    if (fromExt === "pdf" && toExt === "html") {
      const text = await extractPdfText(file);
      const title = file.name.replace(/\.[^.]+$/, "");
      const html = wrapPdfTextAsHtml(text, title);
      const encoder = new TextEncoder();
      return {
        name: swapExtension(file.name, "html"),
        buffer: encoder.encode(html),
        mimeType: "text/html",
        extension: "html",
      };
    }

    if (toExt === "pdf") {
      let text: string;
      if (fromExt === "docx") {
        text = await extractDocxText(file);
      } else if (fromExt === "html") {
        text = fromHtml(new TextDecoder().decode(file.buffer), "txt");
      } else if (fromExt === "md") {
        text = new TextDecoder().decode(file.buffer);
      } else {
        text = await readAsText(file);
      }
      return createPdfFromText(file, text, file.name.replace(/\.[^.]+$/, ""));
    }

    let output: string;

    if (fromExt === "docx" && toExt === "html") {
      output = await extractDocxHtml(file);
    } else if (toExt === "html") {
      const text = await readAsText(file);
      output = await toHtml(text, fromExt);
    } else if (fromExt === "html") {
      output = fromHtml(new TextDecoder().decode(file.buffer), toExt);
    } else if (fromExt === "docx") {
      output = await readAsText(file);
    } else {
      output = await readAsText(file);
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
