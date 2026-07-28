import { useState, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { ToolOutput } from "../../../components/tools/ToolOutput";
import { useBlobUrl } from "../../../hooks/useBlobUrl";
import { exportCanvasToBlob, checkImageDimensions } from "../../../utils/canvasUtils";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "./CompressPage.scss";

function compressImage(src: string, quality: number): Promise<Blob> {
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
        resolve(await exportCanvasToBlob(canvas, "image/jpeg", quality));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Could not load this photo. Try a different file."));
    img.src = src;
  });
}

export function CompressPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [quality, setQuality] = useState(0.7);
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResult } = useBlobUrl();
  const [resultSize, setResultSize] = useState(0);

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

  const handleCompress = useCallback(async () => {
    if (!uploaded) return;
    try {
      const blob = await compressImage(uploaded.objectUrl, quality);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Your smaller photo is ready to download.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not shrink this photo. Try again.");
    }
  }, [uploaded, quality, setResultUrl]);

  const outName = uploaded
    ? uploaded.file.name.replace(/\.[^.]+$/, `-compressed.jpg`)
    : "compressed.jpg";

  const activeStep = resultUrl ? 2 : uploaded ? 1 : 0;

  return (
    <ToolPage
      toolId="compress"
      activeStep={activeStep}
      primaryAction={
        uploaded && !resultUrl
          ? { label: "Shrink Photo", onClick: handleCompress }
          : undefined
      }
    >
      <ImageUpload image={uploaded} onImage={handleImage} onClear={handleClear} />
      {uploaded && !resultUrl && (
        <div className="compress-controls">
          <div className="compress-controls__slider-row">
            <label className="compress-controls__label" htmlFor="quality-slider">
              Quality: {Math.round(quality * 100)}%
            </label>
            <input
              id="quality-slider"
              type="range"
              className="compress-controls__slider"
              min={0.05}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
            <div className="compress-controls__range-labels">
              <span>Smaller file</span>
              <span>Higher quality</span>
            </div>
          </div>
          <p className="compress-controls__note">
            Your photo will be saved as JPEG, which works well for email and websites.
            {uploaded.file.type === "image/png" && " Transparent areas may become white."}
          </p>
        </div>
      )}

      {resultUrl && uploaded && (
        <ToolOutput
          src={resultUrl}
          filename={outName}
          mimeType="image/jpeg"
          originalSize={uploaded.file.size}
          resultSize={resultSize}
          label="Your smaller photo"
        />
      )}
    </ToolPage>
  );
}
