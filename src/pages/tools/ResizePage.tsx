import { useState, useCallback } from "react";
import { ToolPage } from "../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../components/tools/ImageUpload";
import { ToolOutput } from "../../components/tools/ToolOutput";
import { toastSuccess, toastError } from "../../store/toastStore";
import "./ResizePage.scss";

function resizeImage(
  src: string,
  width: number,
  height: number,
  mimeType: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
        mimeType,
        0.92
      );
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function ResizePage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  const aspectRatio = uploaded ? uploaded.width / uploaded.height : 1;

  const handleImage = useCallback((img: UploadedImage) => {
    setUploaded(img);
    setWidth(img.width);
    setHeight(img.height);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }, [resultUrl]);

  const handleClear = useCallback(() => {
    setUploaded(null);
    setWidth(0);
    setHeight(0);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }, [resultUrl]);

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && val > 0) setHeight(Math.round(val / aspectRatio));
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && val > 0) setWidth(Math.round(val * aspectRatio));
  };

  const handleResize = useCallback(async () => {
    if (!uploaded || width <= 0 || height <= 0) return;
    try {
      const mimeType = uploaded.file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await resizeImage(uploaded.objectUrl, width, height, mimeType);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Resized. Ready to download.");
    } catch {
      toastError("Resize failed. Try again.");
    }
  }, [uploaded, width, height, resultUrl]);

  const ext = uploaded?.file.type === "image/png" ? "png" : "jpg";
  const outName = uploaded
    ? uploaded.file.name.replace(/\.[^.]+$/, `-${width}x${height}.${ext}`)
    : `resized.${ext}`;

  return (
    <ToolPage title="Resize" description="Resize images to exact dimensions or scale proportionally.">
      <ImageUpload image={uploaded} onImage={handleImage} onClear={handleClear} />

      {uploaded && (
        <div className="resize-controls">
          <div className="resize-controls__dims">
            <label className="resize-field">
              <span className="resize-field__label">Width</span>
              <input
                type="number"
                className="resize-field__input"
                value={width}
                min={1}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
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
                value={height}
                min={1}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
              />
              <span className="resize-field__unit">px</span>
            </label>
          </div>

          <span className="resize-controls__original">
            Original: {uploaded.width} &times; {uploaded.height}
          </span>

          <button type="button" className="resize-controls__btn" onClick={handleResize}>
            Resize Image
          </button>
        </div>
      )}

      {resultUrl && (
        <ToolOutput
          src={resultUrl}
          filename={outName}
          mimeType={uploaded?.file.type === "image/png" ? "image/png" : "image/jpeg"}
          originalSize={uploaded?.file.size}
          resultSize={resultSize}
          label="Resized result"
        />
      )}
    </ToolPage>
  );
}
