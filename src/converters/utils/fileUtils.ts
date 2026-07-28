import type { FileData, FormatCategory, FormatDefinition } from "../core/types";

export const FORMAT_CATALOG: Record<string, FormatDefinition> = {
  jpg:   { extension: "jpg",   label: "JPEG",       mimeType: "image/jpeg",       category: "image" },
  jpeg:  { extension: "jpeg",  label: "JPEG",       mimeType: "image/jpeg",       category: "image" },
  png:   { extension: "png",   label: "PNG",        mimeType: "image/png",        category: "image" },
  webp:  { extension: "webp",  label: "WebP",       mimeType: "image/webp",       category: "image" },
  gif:   { extension: "gif",   label: "GIF",        mimeType: "image/gif",        category: "image" },
  bmp:   { extension: "bmp",   label: "BMP",        mimeType: "image/bmp",        category: "image" },
  tiff:  { extension: "tiff",  label: "TIFF",       mimeType: "image/tiff",       category: "image" },
  avif:  { extension: "avif",  label: "AVIF",       mimeType: "image/avif",       category: "image" },
  svg:   { extension: "svg",   label: "SVG",        mimeType: "image/svg+xml",    category: "image" },
  ico:   { extension: "ico",   label: "ICO",        mimeType: "image/x-icon",     category: "image" },
  heic:  { extension: "heic",  label: "HEIC",       mimeType: "image/heic",       category: "image" },
  heif:  { extension: "heif",  label: "HEIF",       mimeType: "image/heif",       category: "image" },
  mp3:   { extension: "mp3",   label: "MP3",        mimeType: "audio/mpeg",       category: "audio" },
  wav:   { extension: "wav",   label: "WAV",        mimeType: "audio/wav",        category: "audio" },
  ogg:   { extension: "ogg",   label: "OGG",        mimeType: "audio/ogg",        category: "audio" },
  flac:  { extension: "flac",  label: "FLAC",       mimeType: "audio/flac",       category: "audio" },
  aac:   { extension: "aac",   label: "AAC",        mimeType: "audio/aac",        category: "audio" },
  m4a:   { extension: "m4a",   label: "M4A",        mimeType: "audio/mp4",        category: "audio" },
  opus:  { extension: "opus",  label: "Opus",       mimeType: "audio/opus",       category: "audio" },
  aiff:  { extension: "aiff",  label: "AIFF",       mimeType: "audio/aiff",       category: "audio" },
  wma:   { extension: "wma",   label: "WMA",        mimeType: "audio/x-ms-wma",   category: "audio" },
  amr:   { extension: "amr",   label: "AMR",        mimeType: "audio/amr",        category: "audio" },
  ac3:   { extension: "ac3",   label: "AC3",        mimeType: "audio/ac3",        category: "audio" },
  mid:   { extension: "mid",   label: "MIDI",       mimeType: "audio/midi",       category: "audio" },
  midi:  { extension: "midi",  label: "MIDI",       mimeType: "audio/midi",       category: "audio" },
  mp4:   { extension: "mp4",   label: "MP4",        mimeType: "video/mp4",        category: "video" },
  m4v:   { extension: "m4v",   label: "M4V",        mimeType: "video/x-m4v",      category: "video" },
  webm:  { extension: "webm",  label: "WebM",       mimeType: "video/webm",       category: "video" },
  mov:   { extension: "mov",   label: "MOV",        mimeType: "video/quicktime",  category: "video" },
  avi:   { extension: "avi",   label: "AVI",        mimeType: "video/x-msvideo",  category: "video" },
  mkv:   { extension: "mkv",   label: "MKV",        mimeType: "video/x-matroska", category: "video" },
  wmv:   { extension: "wmv",   label: "WMV",        mimeType: "video/x-ms-wmv",   category: "video" },
  "3gp": { extension: "3gp",   label: "3GP",        mimeType: "video/3gpp",       category: "video" },
  flv:   { extension: "flv",   label: "FLV",        mimeType: "video/x-flv",      category: "video" },
  mpg:   { extension: "mpg",   label: "MPEG",       mimeType: "video/mpeg",       category: "video" },
  mpeg:  { extension: "mpeg",  label: "MPEG",       mimeType: "video/mpeg",       category: "video" },
  ts:    { extension: "ts",    label: "MPEG-TS",    mimeType: "video/mp2t",       category: "video" },
  pdf:   { extension: "pdf",   label: "PDF",        mimeType: "application/pdf",  category: "document" },
  txt:   { extension: "txt",   label: "Plain Text", mimeType: "text/plain",       category: "document" },
  md:    { extension: "md",    label: "Markdown",   mimeType: "text/markdown",    category: "document" },
  html:  { extension: "html",  label: "HTML",       mimeType: "text/html",        category: "document" },
  htm:   { extension: "htm",   label: "HTML",       mimeType: "text/html",        category: "document" },
  rtf:   { extension: "rtf",   label: "RTF",        mimeType: "application/rtf",  category: "document" },
  docx:  { extension: "docx",  label: "Word (DOCX)", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", category: "document" },
  json:  { extension: "json",  label: "JSON",       mimeType: "application/json", category: "data" },
  ndjson:{ extension: "ndjson",label: "NDJSON",     mimeType: "application/x-ndjson", category: "data" },
  csv:   { extension: "csv",   label: "CSV",        mimeType: "text/csv",         category: "data" },
  tsv:   { extension: "tsv",   label: "TSV",        mimeType: "text/tab-separated-values", category: "data" },
  xml:   { extension: "xml",   label: "XML",        mimeType: "application/xml",  category: "data" },
  yaml:  { extension: "yaml",  label: "YAML",       mimeType: "text/yaml",        category: "data" },
  yml:   { extension: "yml",   label: "YAML",       mimeType: "text/yaml",        category: "data" },
  toml:  { extension: "toml",  label: "TOML",       mimeType: "text/toml",        category: "data" },
  xlsx:  { extension: "xlsx",  label: "Excel (XLSX)", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", category: "data" },
  xls:   { extension: "xls",   label: "Excel (XLS)", mimeType: "application/vnd.ms-excel", category: "data" },
};

export const ALL_FORMAT_EXTENSIONS = [...new Set(Object.values(FORMAT_CATALOG).map((f) => f.extension))];

export const CATEGORY_LABELS: Record<FormatCategory, string> = {
  image:    "Images",
  audio:    "Audio",
  video:    "Video",
  document: "Documents",
  data:     "Data",
};

export function normalizeExtension(ext: string): string {
  const lower = ext.toLowerCase();
  if (lower === "yml") return "yaml";
  if (lower === "htm") return "html";
  if (lower === "jpeg") return "jpg";
  return lower;
}

export function normalizeMimeType(mime: string): string {
  const map: Record<string, string> = {
    "image/jpg": "image/jpeg",
    "audio/mp3": "audio/mpeg",
    "audio/x-wav": "audio/wav",
    "audio/x-flac": "audio/flac",
    "text/x-markdown": "text/markdown",
  };
  return map[mime] ?? mime;
}

export function getExtensionFromFile(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

export function swapExtension(filename: string, newExt: string): string {
  const base = filename.includes(".") ? filename.substring(0, filename.lastIndexOf(".")) : filename;
  return `${base}.${newExt}`;
}

export function formatsByCategory(): Record<FormatCategory, FormatDefinition[]> {
  const result: Record<FormatCategory, FormatDefinition[]> = {
    image: [], audio: [], video: [], document: [], data: [],
  };
  const seen = new Set<string>();
  for (const def of Object.values(FORMAT_CATALOG)) {
    const key = `${def.category}:${def.extension}`;
    if (!seen.has(key)) {
      seen.add(key);
      result[def.category].push(def);
    }
  }
  return result;
}

export async function fileToFileData(file: File): Promise<FileData> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const extension = getExtensionFromFile(file);
  const mimeType = normalizeMimeType(file.type || "application/octet-stream");
  return { name: file.name, buffer, mimeType, extension };
}

export function fileDataToBlob(fileData: FileData): Blob {
  return new Blob([fileData.buffer.slice()], { type: fileData.mimeType });
}

export function downloadFileData(fileData: FileData): void {
  const blob = fileDataToBlob(fileData);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileData.name;
  a.click();
  URL.revokeObjectURL(url);
}
