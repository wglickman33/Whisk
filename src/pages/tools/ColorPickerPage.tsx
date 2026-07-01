import { useState, useRef, useCallback, useEffect } from "react";
import { ToolPage } from "../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../components/tools/ImageUpload";
import { toastSuccess, toastError } from "../../store/toastStore";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!uploaded) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
    };
    img.src = uploaded.objectUrl;
  }, [uploaded]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      const ctx = canvas.getContext("2d")!;
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      setPicked({ hex: rgbToHex(r, g, b), r, g, b });
      setCopied("");
    },
    []
  );

  const handleCopy = useCallback(
    (value: string) => {
      navigator.clipboard.writeText(value).then(() => {
        setCopied(value);
        toastSuccess("Copied to clipboard.");
      }).catch(() => {
        toastError("Copy failed.");
      });
    },
    []
  );

  const handleClear = useCallback(() => {
    setUploaded(null);
    setPicked(null);
    setCopied("");
  }, []);

  return (
    <ToolPage title="Color Picker" description="Upload an image, click anywhere to grab the exact color.">
      <ImageUpload image={uploaded} onImage={setUploaded} onClear={handleClear} />
      {uploaded && (
        <div className="colorpick">
          <p className="colorpick__hint">Click anywhere on the image to pick a color.</p>
          <canvas
            ref={canvasRef}
            className="colorpick__canvas"
            onClick={handleCanvasClick}
          />

          {picked && (
            <div className="colorpick__result">
              <div
                className="colorpick__swatch"
                style={{ backgroundColor: picked.hex }}
              />
              <div className="colorpick__values">
                <button
                  type="button"
                  className="colorpick__value"
                  onClick={() => handleCopy(picked.hex)}
                  title="Copy hex"
                >
                  {picked.hex}
                  {copied === picked.hex && <span className="colorpick__copied">Copied!</span>}
                </button>
                <button
                  type="button"
                  className="colorpick__value"
                  onClick={() => handleCopy(`rgb(${picked.r}, ${picked.g}, ${picked.b})`)}
                  title="Copy rgb"
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
