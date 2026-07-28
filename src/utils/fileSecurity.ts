/**
 * Client-side file upload validation.
 * Files are processed locally and never sent to our server for conversion,
 * but malicious files can still attack the user's browser — validate before processing.
 */

import { getSupportedOutputFormats } from "../converters/core/conversionEngine";

export const FILE_SIZE_LIMITS = {
  imageTool: 25 * 1024 * 1024,   // 25 MB
  fileConverter: 200 * 1024 * 1024, // 200 MB (video)
  document: 15 * 1024 * 1024,    // 15 MB
} as const;

/** Extensions that must never be processed, even if renamed */
const BLOCKED_EXTENSIONS = new Set([
  "exe", "msi", "bat", "cmd", "com", "scr", "pif", "vbs", "vbe", "js", "jse",
  "ws", "wsf", "wsh", "ps1", "psm1", "dll", "sys", "drv", "apk", "app", "deb",
  "rpm", "dmg", "pkg", "jar", "class", "php", "asp", "aspx", "jsp", "cgi",
  "sh", "bash", "zsh", "fish", "bin", "iso", "img", "hta", "lnk", "inf",
  "reg", "msc", "cpl", "msc", "xll", "xlm", "xlsm", "docm", "pptm",
]);

/** Dangerous MIME types */
const BLOCKED_MIME_PREFIXES = [
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-sh",
  "application/javascript",
  "text/javascript",
  "application/x-httpd-php",
];

const MAGIC_SIGNATURES: { ext: string; bytes: number[]; offset?: number }[] = [
  { ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { ext: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { ext: "webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP checked loosely
  { ext: "bmp", bytes: [0x42, 0x4d] },
  { ext: "pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { ext: "zip", bytes: [0x50, 0x4b, 0x03, 0x04] }, // xlsx, docx, odt
  { ext: "mp3", bytes: [0x49, 0x44, 0x33] }, // ID3
  { ext: "flac", bytes: [0x66, 0x4c, 0x61, 0x43] },
  { ext: "ogg", bytes: [0x4f, 0x67, 0x67, 0x53] },
  { ext: "wav", bytes: [0x52, 0x49, 0x46, 0x46] },
  { ext: "mp4", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { ext: "mkv", bytes: [0x1a, 0x45, 0xdf, 0xa3] },
  { ext: "avi", bytes: [0x52, 0x49, 0x46, 0x46] },
];

/** Formats where magic-byte check is skipped (browser handles safely or no reliable signature) */
const SKIP_MAGIC_CHECK = new Set([
  "txt", "md", "html", "htm", "rtf", "csv", "tsv", "json", "ndjson", "xml",
  "yaml", "yml", "toml", "svg", "heic", "heif", "mov", "webm", "wmv", "3gp",
  "m4v", "aac", "m4a", "opus", "aiff", "wma", "avif", "tiff", "ico",
  "flv", "mpg", "mpeg", "ts", "amr", "ac3", "mid", "midi",
]);

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\<>:"|?*\u0000]/g, "_").replace(/\.{2,}/g, ".").trim();
}

function getExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  if (parts.length < 2) return "";
  return parts.pop() ?? "";
}

function hasBlockedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  const parts = lower.split(".");
  for (const part of parts) {
    if (BLOCKED_EXTENSIONS.has(part)) return true;
  }
  return false;
}

function matchesMagic(buffer: Uint8Array, ext: string): boolean {
  if (SKIP_MAGIC_CHECK.has(ext)) return true;

  const sig = MAGIC_SIGNATURES.find((s) => {
    if (s.ext !== ext && !(ext === "jpeg" && s.ext === "jpg") &&
        !(ext === "xlsx" && s.ext === "zip") &&
        !(ext === "xls" && s.ext === "zip") &&
        !(ext === "docx" && s.ext === "zip")) {
      return false;
    }
    const offset = s.offset ?? 0;
    if (buffer.length < offset + s.bytes.length) return false;
    return s.bytes.every((b, i) => buffer[offset + i] === b);
  });

  if (sig) return true;

  // MP3 without ID3 tag
  if (ext === "mp3" && buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return true;
  }

  // Text-based formats: verify mostly printable UTF-8
  if (["txt", "md", "csv", "tsv", "json", "xml", "yaml", "yml", "toml", "html", "htm", "rtf", "ndjson"].includes(ext)) {
    const sample = buffer.slice(0, Math.min(buffer.length, 512));
    let nonPrintable = 0;
    for (const b of sample) {
      if (b === 9 || b === 10 || b === 13) continue;
      if (b < 32 || b === 127) nonPrintable++;
    }
    return nonPrintable / sample.length < 0.1;
  }

  return false;
}

export function validateUploadedFile(
  file: File,
  options: {
    maxBytes: number;
    allowedExtensions?: string[];
  }
): FileValidationResult {
  const name = sanitizeFilename(file.name);
  if (!name || name.length > 255) {
    return { ok: false, error: "Invalid file name." };
  }

  if (hasBlockedExtension(name)) {
    return { ok: false, error: "This file type is not allowed for security reasons." };
  }

  const mime = file.type.toLowerCase();
  if (BLOCKED_MIME_PREFIXES.some((p) => mime.startsWith(p))) {
    return { ok: false, error: "This file type is not allowed for security reasons." };
  }

  if (file.size === 0) {
    return { ok: false, error: "File is empty." };
  }

  if (file.size > options.maxBytes) {
    const mb = Math.round(options.maxBytes / (1024 * 1024));
    return { ok: false, error: `File exceeds the ${mb} MB limit.` };
  }

  const ext = getExtension(name);
  if (!ext) {
    return { ok: false, error: "File must have an extension." };
  }

  if (options.allowedExtensions && !options.allowedExtensions.includes(ext)) {
    return { ok: false, error: `Unsupported format: .${ext.toUpperCase()}` };
  }

  return { ok: true };
}

export async function validateFileContent(
  file: File,
  expectedExt: string
): Promise<FileValidationResult> {
  const ext = expectedExt.toLowerCase().replace("jpeg", "jpg");
  const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());

  if (!matchesMagic(header, ext)) {
    return {
      ok: false,
      error: "File content does not match its extension. Upload may be corrupted or disguised.",
    };
  }

  return { ok: true };
}

/** Strip script content from SVG text before rasterizing */
export function sanitizeSvgContent(svgText: string): string {
  return svgText
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export async function validateFileForConverter(file: File): Promise<FileValidationResult> {
  const basic = validateUploadedFile(file, { maxBytes: FILE_SIZE_LIMITS.fileConverter });
  if (!basic.ok) return basic;

  const ext = getExtension(file.name);
  if (getSupportedOutputFormats(ext).length === 0) {
    return { ok: false, error: `No conversions available for .${ext.toUpperCase()} files.` };
  }

  return validateFileContent(file, ext);
}

export async function validateImageForTools(file: File): Promise<FileValidationResult> {
  const allowed = ["png", "jpg", "jpeg", "webp", "bmp", "gif", "heic", "heif"];
  const basic = validateUploadedFile(file, {
    maxBytes: FILE_SIZE_LIMITS.imageTool,
    allowedExtensions: allowed,
  });
  if (!basic.ok) return basic;

  const ext = getExtension(file.name);
  if (ext === "heic" || ext === "heif") return { ok: true };
  return validateFileContent(file, ext);
}
