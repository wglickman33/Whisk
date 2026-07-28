import { PDFDocument } from "pdf-lib";

export interface PdfImageInput {
  blob: Blob;
  width: number;
  height: number;
}

export async function imagesToPdf(images: PdfImageInput[]): Promise<Uint8Array> {
  if (images.length === 0) throw new Error("Add at least one photo.");

  const pdf = await PDFDocument.create();

  for (const img of images) {
    const bytes = new Uint8Array(await img.blob.arrayBuffer());
    const isPng = img.blob.type === "image/png";
    const embedded = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: img.width, height: img.height });
  }

  return pdf.save();
}
