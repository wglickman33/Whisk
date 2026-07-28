import type { FileData } from "../core/types";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { zipSync } from "fflate";
import { mimeForImageFormat } from "./imageUtils";

export const PDF_IMAGE_MAX_PAGES = 50;
export const PDF_IMAGE_MAX_SIDE_PX = 4096;

export type PdfImageFormat = "png" | "jpg" | "webp";

export function getPdfPageLimit(numPages: number): {
  pagesToRender: number;
  wasCapped: boolean;
} {
  if (numPages <= 0) {
    throw new Error("PDF has no pages.");
  }
  if (numPages > PDF_IMAGE_MAX_PAGES) {
    return { pagesToRender: PDF_IMAGE_MAX_PAGES, wasCapped: true };
  }
  return { pagesToRender: numPages, wasCapped: false };
}

export function scaleToMaxSide(width: number, height: number, maxSide: number): { width: number; height: number; scale: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) {
    return { width, height, scale: 1 };
  }
  const scale = maxSide / longest;
  return {
    width: Math.floor(width * scale),
    height: Math.floor(height * scale),
    scale,
  };
}

async function canvasToBuffer(
  canvas: HTMLCanvasElement,
  format: PdfImageFormat
): Promise<Uint8Array> {
  const mime = mimeForImageFormat(format);
  const quality = format === "png" ? undefined : 0.92;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode image."))),
      mime,
      quality
    );
  });

  return new Uint8Array(await blob.arrayBuffer());
}

export async function convertPdfToImages(
  file: FileData,
  outputFormat: PdfImageFormat,
  onProgress?: (page: number, total: number) => void
): Promise<FileData> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const doc = await pdfjs.getDocument({ data: file.buffer.slice() }).promise;
  const { pagesToRender, wasCapped } = getPdfPageLimit(doc.numPages);

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const pageBuffers: { name: string; data: Uint8Array }[] = [];

  for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
    onProgress?.(pageNum, pagesToRender);

    const page = await doc.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const { scale } = scaleToMaxSide(
      baseViewport.width,
      baseViewport.height,
      PDF_IMAGE_MAX_SIDE_PX
    );
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not available.");

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const buffer = await canvasToBuffer(canvas, outputFormat);
    const suffix = pagesToRender === 1 ? "" : `-page-${pageNum}`;
    pageBuffers.push({
      name: `${baseName}${suffix}.${outputFormat}`,
      data: buffer,
    });
  }

  if (pageBuffers.length === 1) {
    const single = pageBuffers[0];
    return {
      name: single.name,
      buffer: single.data,
      mimeType: mimeForImageFormat(outputFormat),
      extension: outputFormat,
    };
  }

  const zipEntries: Record<string, Uint8Array> = {};
  for (const page of pageBuffers) {
    zipEntries[page.name] = page.data;
  }

  const zipBuffer = zipSync(zipEntries);
  let zipName = `${baseName}-${outputFormat}-pages.zip`;
  if (wasCapped) {
    zipName = `${baseName}-${outputFormat}-pages-${PDF_IMAGE_MAX_PAGES}-cap.zip`;
  }

  return {
    name: zipName,
    buffer: zipBuffer,
    mimeType: "application/zip",
    extension: "zip",
  };
}

export function wrapPdfTextAsHtml(text: string, title: string): string {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const safeTitle = escapeHtml(title);
  const escaped = escapeHtml(text);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>body{font-family:system-ui,sans-serif;margin:2rem;line-height:1.5}pre{white-space:pre-wrap;word-break:break-word}</style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <pre>${escaped}</pre>
</body>
</html>`;
}
