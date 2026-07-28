import { useState, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { ToolOutput } from "../../../components/tools/ToolOutput";
import { useBlobUrl } from "../../../hooks/useBlobUrl";
import {
  exportCanvasToBlob,
  getOutputMimeType,
  getSafeCanvasDimensions,
} from "../../../utils/canvasUtils";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "./ResizePage.scss";

function resizeImage(
  src: string,
  width: number,
  height: number,
  mimeType: string
): Promise<Blob> {
  const check = getSafeCanvasDimensions(width, height);
  if (!check.ok) return Promise.reject(new Error(check.error));

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not prepare your photo. Try a different file."));
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        resolve(await exportCanvasToBlob(canvas, mimeType));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Could not load this photo. Try a different file."));
    img.src = src;
  });
}

function parseDimension(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

export function ResizePage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [lockAspect, setLockAspect] = useState(true);
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResult } = useBlobUrl();
  const [resultSize, setResultSize] = useState(0);

  const width = parseDimension(widthInput) ?? 0;
  const height = parseDimension(heightInput) ?? 0;
  const aspectRatio = uploaded ? uploaded.width / uploaded.height : 1;

  const handleImage = useCallback(
    (img: UploadedImage) => {
      setUploaded(img);
      setWidthInput(String(img.width));
      setHeightInput(String(img.height));
      clearResult();
      setResultSize(0);
    },
    [clearResult]
  );

  const handleClear = useCallback(() => {
    setUploaded(null);
    setWidthInput("");
    setHeightInput("");
    clearResult();
    setResultSize(0);
  }, [clearResult]);

  const handleWidthChange = (val: string) => {
    setWidthInput(val);
    const n = parseDimension(val);
    if (lockAspect && n && n > 0) setHeightInput(String(Math.round(n / aspectRatio)));
  };

  const handleHeightChange = (val: string) => {
    setHeightInput(val);
    const n = parseDimension(val);
    if (lockAspect && n && n > 0) setWidthInput(String(Math.round(n * aspectRatio)));
  };

  const handleResize = useCallback(async () => {
    if (!uploaded || width <= 0 || height <= 0) {
      toastError("Enter a valid width and height.");
      return;
    }
    try {
      const mimeType = getOutputMimeType(uploaded.file.type);
      const blob = await resizeImage(uploaded.objectUrl, width, height, mimeType);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Your resized photo is ready to download.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not resize this photo. Try again.");
    }
  }, [uploaded, width, height, setResultUrl]);

  const ext = uploaded?.file.type === "image/png" ? "png" : "jpg";
  const outName = uploaded
    ? uploaded.file.name.replace(/\.[^.]+$/, `-${width}x${height}.${ext}`)
    : `resized.${ext}`;

  const activeStep = resultUrl ? 2 : uploaded ? 1 : 0;
  const canResize = uploaded && width > 0 && height > 0;

  return (
    <ToolPage
      toolId="resize"
      activeStep={activeStep}
      primaryAction={
        uploaded && !resultUrl
          ? { label: "Resize Photo", onClick: handleResize, disabled: !canResize }
          : undefined
      }
    >
      <ImageUpload image={uploaded} onImage={handleImage} onClear={handleClear} />

      {uploaded && !resultUrl && (
        <div className="resize-controls">
          <div className="resize-controls__dims">
            <label className="resize-field">
              <span className="resize-field__label">Width</span>
              <input
                type="number"
                className="resize-field__input"
                value={widthInput}
                min={1}
                onChange={(e) => handleWidthChange(e.target.value)}
              />
              <span className="resize-field__unit">px</span>
            </label>

            <button
              type="button"
              className={`resize-controls__lock ${lockAspect ? "resize-controls__lock--active" : ""}`}
              onClick={() => setLockAspect(!lockAspect)}
              title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
              aria-label={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {lockAspect ? "🔗" : "🔓"}
            </button>

            <label className="resize-field">
              <span className="resize-field__label">Height</span>
              <input
                type="number"
                className="resize-field__input"
                value={heightInput}
                min={1}
                onChange={(e) => handleHeightChange(e.target.value)}
              />
              <span className="resize-field__unit">px</span>
            </label>
          </div>

          <span className="resize-controls__original">
            Original: {uploaded.width} &times; {uploaded.height} pixels
          </span>
        </div>
      )}

      {resultUrl && (
        <ToolOutput
          src={resultUrl}
          filename={outName}
          mimeType={uploaded?.file.type === "image/png" ? "image/png" : "image/jpeg"}
          originalSize={uploaded?.file.size}
          resultSize={resultSize}
          label="Your resized photo"
        />
      )}
    </ToolPage>
  );
}
