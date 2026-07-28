import type { FileData } from "../core/types";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export async function createPdfFromText(
  file: FileData,
  text: string,
  title?: string
): Promise<FileData> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const margin = 50;
  const lineHeight = fontSize * 1.4;
  const pageWidth = 612;
  const pageHeight = 792;
  const maxWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  if (title) {
    page.drawText(title, { x: margin, y, size: 16, font, color: rgb(0.1, 0.1, 0.1) });
    y -= lineHeight * 2;
  }

  const paragraphs = text.split(/\n/);
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && line) {
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
        y -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      if (y < margin + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
      y -= lineHeight;
    }
    y -= lineHeight * 0.3;
  }

  const pdfBytes = await pdfDoc.save();
  return {
    name: file.name.replace(/\.[^.]+$/, ".pdf"),
    buffer: pdfBytes,
    mimeType: "application/pdf",
    extension: "pdf",
  };
}

export async function extractPdfText(file: FileData): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const doc = await pdfjs.getDocument({ data: file.buffer.slice() }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n\n").trim();
}

type TableRow = Record<string, unknown>;

export async function createPdfFromRows(
  file: FileData,
  rows: TableRow[],
  title?: string
): Promise<FileData> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 792;
  const pageHeight = 612;
  const margin = 40;
  const fontSize = 9;
  const rowHeight = 14;
  const docTitle = title ?? file.name.replace(/\.[^.]+$/, "");

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  page.drawText(docTitle, {
    x: margin,
    y,
    size: 14,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= rowHeight * 2;

  if (!rows.length) {
    page.drawText("No data rows.", { x: margin, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) });
  } else {
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const colWidth = Math.min(120, (pageWidth - margin * 2) / Math.max(headers.length, 1));

    const drawRow = (cells: string[], isHeader: boolean) => {
      if (y < margin + rowHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      cells.forEach((cell, i) => {
        page.drawText(cell.slice(0, 28), {
          x: margin + i * colWidth,
          y,
          size: fontSize,
          font: isHeader ? bold : font,
          color: rgb(0.15, 0.15, 0.15),
        });
      });
      y -= rowHeight;
    };

    drawRow(headers, true);
    for (const row of rows) {
      drawRow(headers.map((h) => String(row[h] ?? "")), false);
    }
  }

  const pdfBytes = await pdfDoc.save();
  return {
    name: file.name.replace(/\.[^.]+$/, ".pdf"),
    buffer: pdfBytes,
    mimeType: "application/pdf",
    extension: "pdf",
  };
}
