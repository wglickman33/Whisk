import type { FileData } from "../core/types";
import { sanitizeSvgContent } from "../../utils/fileSecurity";

const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

export function isHeicExtension(ext: string): boolean {
  return HEIC_EXTENSIONS.has(ext.toLowerCase());
}

export async function normalizeHeicFileData(file: FileData): Promise<FileData> {
  if (!isHeicExtension(file.extension)) return file;

  const heic2any = (await import("heic2any")).default;
  const blob = await heic2any({
    blob: new Blob([file.buffer.slice()], { type: file.mimeType }),
    toType: "image/jpeg",
    quality: 0.92,
  });
  const result = blob instanceof Blob ? blob : blob[0];
  const buffer = new Uint8Array(await result.arrayBuffer());

  return {
    name: file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg"),
    buffer,
    mimeType: "image/jpeg",
    extension: "jpg",
  };
}

export async function rasterizeSvg(file: FileData): Promise<FileData> {
  if (file.extension.toLowerCase() !== "svg") return file;

  const sanitized = sanitizeSvgContent(new TextDecoder().decode(file.buffer));
  const safeBlob = new Blob([sanitized], { type: "image/svg+xml" });
  const url = URL.createObjectURL(safeBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to load SVG"));
      el.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 512;
    canvas.height = img.naturalHeight || 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0);

    const outBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to rasterize SVG"))),
        "image/png"
      );
    });

    return {
      name: file.name.replace(/\.svg$/i, ".png"),
      buffer: new Uint8Array(await outBlob.arrayBuffer()),
      mimeType: "image/png",
      extension: "png",
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareImageForConversion(file: FileData): Promise<FileData> {
  let prepared = file;
  if (isHeicExtension(prepared.extension)) {
    prepared = await normalizeHeicFileData(prepared);
  }
  if (prepared.extension.toLowerCase() === "svg") {
    prepared = await rasterizeSvg(prepared);
  }
  return prepared;
}

export function mimeForImageFormat(format: string): string {
  if (format === "jpg" || format === "jpeg") return "image/jpeg";
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  if (format === "gif") return "image/gif";
  if (format === "bmp") return "image/bmp";
  if (format === "tiff") return "image/tiff";
  if (format === "avif") return "image/avif";
  if (format === "ico") return "image/x-icon";
  if (format === "pdf") return "application/pdf";
  return `image/${format}`;
}

const CANVAS_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);

export function canConvertImageWithCanvas(from: string, to: string): boolean {
  return from !== "gif" && CANVAS_FORMATS.has(from) && CANVAS_FORMATS.has(to);
}

export async function convertImageWithCanvas(
  file: FileData,
  outputFormat: string
): Promise<FileData> {
  const blob = new Blob([file.buffer.slice()], { type: file.mimeType });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const outputMime = mimeForImageFormat(outputFormat);
  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Failed to encode image"))),
      outputMime,
      outputFormat === "jpg" || outputFormat === "jpeg" || outputFormat === "webp" ? 0.92 : undefined
    );
  });

  return {
    name: file.name.replace(/\.[^.]+$/, `.${outputFormat}`),
    buffer: new Uint8Array(await outBlob.arrayBuffer()),
    mimeType: outputMime,
    extension: outputFormat,
  };
}

export async function convertImageToPdf(file: FileData): Promise<FileData> {
  const { PDFDocument } = await import("pdf-lib");
  const raster =
    canConvertImageWithCanvas(file.extension, "png")
      ? await convertImageWithCanvas(file, "png")
      : file;

  const pdfDoc = await PDFDocument.create();
  const isJpeg = raster.mimeType === "image/jpeg";
  const image = isJpeg
    ? await pdfDoc.embedJpg(raster.buffer)
    : await pdfDoc.embedPng(raster.buffer);

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  const pdfBytes = await pdfDoc.save();
  return {
    name: file.name.replace(/\.[^.]+$/, ".pdf"),
    buffer: pdfBytes,
    mimeType: "application/pdf",
    extension: "pdf",
  };
}
