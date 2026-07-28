import { useState, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { ToolOutput } from "../../../components/tools/ToolOutput";
import { useBlobUrl } from "../../../hooks/useBlobUrl";
import {
  exportCanvasToBlob,
  getOutputMimeType,
  checkImageDimensions,
} from "../../../utils/canvasUtils";
import { applyConvolution, buildSharpenKernel } from "../../../utils/sharpenKernel";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "./SharpenPage.scss";

function sharpenImage(src: string, strength: number, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const check = checkImageDimensions(img.naturalWidth, img.naturalHeight);
      if (!check.ok) {
        reject(new Error(check.error));
        return;
      }
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not prepare your photo. Try a different file."));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const kernel = buildSharpenKernel(strength);
        const sharpened = applyConvolution(imageData, kernel, 3);
        ctx.putImageData(sharpened, 0, 0);
        resolve(await exportCanvasToBlob(canvas, mimeType));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Could not load this photo. Try a different file."));
    img.src = src;
  });
}

export function SharpenPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [strength, setStrength] = useState(0.5);
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResult } = useBlobUrl();
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleImage = useCallback(
    (img: UploadedImage) => {
      setUploaded(img);
      clearResult();
      setResultSize(0);
    },
    [clearResult]
  );

  const handleClear = useCallback(() => {
    setUploaded(null);
    clearResult();
    setResultSize(0);
  }, [clearResult]);

  const handleSharpen = useCallback(async () => {
    if (!uploaded || processing) return;
    setProcessing(true);
    try {
      const mimeType = getOutputMimeType(uploaded.file.type);
      const blob = await sharpenImage(uploaded.objectUrl, strength, mimeType);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Your sharpened photo is ready to download.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not sharpen this photo. Try again.");
    } finally {
      setProcessing(false);
    }
  }, [uploaded, strength, processing, setResultUrl]);

  const ext = uploaded?.file.type === "image/png" ? "png" : "jpg";
  const outName = uploaded
    ? uploaded.file.name.replace(/\.[^.]+$/, `-sharpened.${ext}`)
    : `sharpened.${ext}`;

  const activeStep = resultUrl ? 2 : uploaded ? 1 : 0;

  return (
    <ToolPage
      toolId="sharpen"
      activeStep={activeStep}
      primaryAction={
        uploaded && !resultUrl
          ? {
              label: processing ? "Processing…" : "Sharpen Photo",
              onClick: handleSharpen,
              disabled: processing,
            }
          : undefined
      }
    >
      <ImageUpload image={uploaded} onImage={handleImage} onClear={handleClear} />
      {uploaded && !resultUrl && (
        <div className="sharpen-controls">
          <div className="sharpen-controls__slider-row">
            <label className="sharpen-controls__label" htmlFor="sharpen-slider">
              Strength: {strength.toFixed(1)}
            </label>
            <input
              id="sharpen-slider"
              type="range"
              className="sharpen-controls__slider"
              min={0.1}
              max={2}
              step={0.1}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
            />
            <div className="sharpen-controls__range-labels">
              <span>Subtle</span>
              <span>Strong</span>
            </div>
          </div>
        </div>
      )}

      {resultUrl && (
        <ToolOutput
          src={resultUrl}
          filename={outName}
          mimeType={uploaded?.file.type === "image/png" ? "image/png" : "image/jpeg"}
          originalSize={uploaded?.file.size}
          resultSize={resultSize}
          label="Your sharpened photo"
        />
      )}
    </ToolPage>
  );
}
