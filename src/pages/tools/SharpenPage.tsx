import { useState, useCallback } from "react";
import { ToolPage } from "../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../components/tools/ImageUpload";
import { ToolOutput } from "../../components/tools/ToolOutput";
import { toastSuccess, toastError } from "../../store/toastStore";
import "./SharpenPage.scss";

function applyConvolution(imageData: ImageData, kernel: number[], kernelSize: number): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx - half));
          const py = Math.min(height - 1, Math.max(0, y + ky - half));
          const i = (py * width + px) * 4;
          const w = kernel[ky * kernelSize + kx];
          r += data[i] * w;
          g += data[i + 1] * w;
          b += data[i + 2] * w;
        }
      }
      const idx = (y * width + x) * 4;
      output.data[idx] = Math.min(255, Math.max(0, r));
      output.data[idx + 1] = Math.min(255, Math.max(0, g));
      output.data[idx + 2] = Math.min(255, Math.max(0, b));
      output.data[idx + 3] = data[idx + 3];
    }
  }
  return output;
}

function buildSharpenKernel(strength: number): number[] {
  const s = strength;
  return [
    0,   -s,       0,
    -s,  1 + 4*s, -s,
    0,   -s,       0,
  ];
}

function sharpenImage(src: string, strength: number, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const kernel = buildSharpenKernel(strength);
      const sharpened = applyConvolution(imageData, kernel, 3);
      ctx.putImageData(sharpened, 0, 0);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
        mimeType,
        0.92
      );
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function SharpenPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [strength, setStrength] = useState(0.5);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleClear = useCallback(() => {
    setUploaded(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }, [resultUrl]);

  const handleSharpen = useCallback(async () => {
    if (!uploaded) return;
    setProcessing(true);
    try {
      const mimeType = uploaded.file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await sharpenImage(uploaded.objectUrl, strength, mimeType);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Sharpened. Ready to download.");
    } catch {
      toastError("Sharpen failed. Try again.");
    } finally {
      setProcessing(false);
    }
  }, [uploaded, strength, resultUrl]);

  const ext = uploaded?.file.type === "image/png" ? "png" : "jpg";
  const outName = uploaded
    ? uploaded.file.name.replace(/\.[^.]+$/, `-sharpened.${ext}`)
    : `sharpened.${ext}`;

  return (
    <ToolPage title="Sharpen" description="Enhance image clarity with an adjustable sharpening filter.">
      <ImageUpload image={uploaded} onImage={setUploaded} onClear={handleClear} />
      {uploaded && (
        <div className="sharpen-controls">
          <div className="sharpen-controls__slider-row">
            <label className="sharpen-controls__label" htmlFor="sharpen-slider">
              Strength: {strength.toFixed(2)}
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

          <button
            type="button"
            className="sharpen-controls__btn"
            onClick={handleSharpen}
            disabled={processing}
          >
            {processing ? "Processing..." : "Sharpen Image"}
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
          label="Sharpened result"
        />
      )}
    </ToolPage>
  );
}
