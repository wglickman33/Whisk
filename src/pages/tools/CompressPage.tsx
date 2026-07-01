import { useState, useCallback } from "react";
import { ToolPage } from "../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../components/tools/ImageUpload";
import { ToolOutput } from "../../components/tools/ToolOutput";
import { toastSuccess, toastError } from "../../store/toastStore";
import "./CompressPage.scss";

function compressImage(src: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function CompressPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [quality, setQuality] = useState(0.7);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  const handleClear = useCallback(() => {
    setUploaded(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }, [resultUrl]);

  const handleCompress = useCallback(async () => {
    if (!uploaded) return;
    try {
      const blob = await compressImage(uploaded.objectUrl, quality);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Compressed. Ready to download.");
    } catch {
      toastError("Compress failed. Try again.");
    }
  }, [uploaded, quality, resultUrl]);

  const outName = uploaded
    ? uploaded.file.name.replace(/\.[^.]+$/, `-compressed.jpg`)
    : "compressed.jpg";

  return (
    <ToolPage title="Compress" description="Reduce image file size with a quality slider. Output is JPEG.">
      <ImageUpload image={uploaded} onImage={setUploaded} onClear={handleClear} />
      {uploaded && (
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

          <button type="button" className="compress-controls__btn" onClick={handleCompress}>
            Compress Image
          </button>
        </div>
      )}

      {resultUrl && uploaded && (
        <ToolOutput
          src={resultUrl}
          filename={outName}
          mimeType="image/jpeg"
          originalSize={uploaded.file.size}
          resultSize={resultSize}
          label="Compressed result"
        />
      )}
    </ToolPage>
  );
}
