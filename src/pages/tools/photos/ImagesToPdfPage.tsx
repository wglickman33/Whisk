import { useState, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { MultiImageUpload } from "../../../components/tools/MultiImageUpload";
import type { UploadedImage } from "../../../components/tools/ImageUpload";
import { imagesToPdf } from "../../../utils/tools/imagesToPdf";
import { canvasToBlob, loadImageElement } from "../../../utils/tools/imageCanvas";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "./ImagesToPdfPage.scss";

export function ImagesToPdfPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!images.length || processing) return;
    setProcessing(true);
    try {
      const inputs = await Promise.all(
        images.map(async (img) => {
          const el = await loadImageElement(img.objectUrl);
          const mime = img.file.type === "image/png" ? "image/png" : "image/jpeg";
          const canvas = document.createElement("canvas");
          canvas.width = el.naturalWidth;
          canvas.height = el.naturalHeight;
          canvas.getContext("2d")!.drawImage(el, 0, 0);
          const blob = await canvasToBlob(canvas, mime);
          return { blob, width: el.naturalWidth, height: el.naturalHeight };
        })
      );
      const pdfBytes = await imagesToPdf(inputs);
      const arrayBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "photos.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess("PDF downloaded.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not create PDF.");
    } finally {
      setProcessing(false);
    }
  }, [images, processing]);

  const activeStep = images.length ? (processing ? 2 : 1) : 0;

  return (
    <ToolPage
      toolId="images-to-pdf"
      activeStep={activeStep}
      primaryAction={
        images.length
          ? { label: processing ? "Creating PDF…" : "Download PDF", onClick: handleCreate, disabled: processing }
          : undefined
      }
    >
      <p className="images-pdf__intro">Add photos in the order you want them in the PDF. Each photo becomes one page.</p>
      <MultiImageUpload images={images} onChange={setImages} />
    </ToolPage>
  );
}
