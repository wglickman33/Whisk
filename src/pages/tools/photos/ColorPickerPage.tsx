import { useState, useRef, useCallback, useEffect } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "./ColorPickerPage.scss";

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

interface PickedColor {
  hex: string;
  r: number;
  g: number;
  b: number;
}

export function ColorPickerPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [picked, setPicked] = useState<PickedColor | null>(null);
  const [copied, setCopied] = useState("");
  const [imageReady, setImageReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!uploaded) {
      setImageReady(false);
      setLoadError("");
      return;
    }

    setImageReady(false);
    setLoadError("");
    setPicked(null);
    setCopied("");

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setLoadError("Could not load this photo. Try a different file.");
        return;
      }
      ctx.drawImage(img, 0, 0);
      setImageReady(true);
    };
    img.onerror = () => setLoadError("Could not load this photo. Try a different file.");
    img.src = uploaded.objectUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [uploaded]);

  const handleImage = useCallback((img: UploadedImage) => {
    setUploaded(img);
  }, []);

  const handleClear = useCallback(() => {
    setUploaded(null);
    setPicked(null);
    setCopied("");
    setImageReady(false);
    setLoadError("");
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !imageReady) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.min(canvas.width - 1, Math.max(0, Math.floor((e.clientX - rect.left) * scaleX)));
      const y = Math.min(canvas.height - 1, Math.max(0, Math.floor((e.clientY - rect.top) * scaleY)));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      setPicked({ hex: rgbToHex(r, g, b), r, g, b });
      setCopied("");
    },
    [imageReady]
  );

  const handleCopy = useCallback((value: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(value);
        toastSuccess("Copied to clipboard.");
      })
      .catch(() => toastError("Copy failed. Your browser may not allow clipboard access."));
  }, []);

  const activeStep = picked ? 2 : uploaded ? 1 : 0;

  return (
    <ToolPage toolId="color-picker" activeStep={activeStep}>
      <ImageUpload image={uploaded} onImage={handleImage} onClear={handleClear} />
      {uploaded && (
        <div className="colorpick">
          <p className="colorpick__hint">
            {imageReady
              ? "Click anywhere on your photo to pick a color."
              : loadError || "Loading your photo…"}
          </p>
          <canvas
            ref={canvasRef}
            className={`colorpick__canvas ${imageReady ? "colorpick__canvas--ready" : ""}`}
            onClick={handleCanvasClick}
            aria-disabled={!imageReady}
          />

          {picked && (
            <div className="colorpick__result">
              <div className="colorpick__swatch" style={{ backgroundColor: picked.hex }} />
              <div className="colorpick__values">
                <button
                  type="button"
                  className="colorpick__value"
                  onClick={() => handleCopy(picked.hex)}
                  title="Copy hex color"
                >
                  {picked.hex}
                  {copied === picked.hex && <span className="colorpick__copied">Copied!</span>}
                </button>
                <button
                  type="button"
                  className="colorpick__value"
                  onClick={() => handleCopy(`rgb(${picked.r}, ${picked.g}, ${picked.b})`)}
                  title="Copy RGB color"
                >
                  rgb({picked.r}, {picked.g}, {picked.b})
                  {copied === `rgb(${picked.r}, ${picked.g}, ${picked.b})` && (
                    <span className="colorpick__copied">Copied!</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolPage>
  );
}
