import { useState, useEffect, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { loadImageElement, imageToCanvas } from "../../../utils/tools/imageCanvas";
import { extractPalette, type PaletteColor } from "../../../utils/tools/imagePalette";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "../shared/PhotoToolControls.scss";

export function PalettePage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [colors, setColors] = useState<PaletteColor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uploaded) {
      setColors([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const img = await loadImageElement(uploaded.objectUrl);
        const canvas = await imageToCanvas(img);
        const ctx = canvas.getContext("2d")!;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (!cancelled) setColors(extractPalette(data, 8));
      } catch {
        if (!cancelled) setColors([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uploaded]);

  const copyColor = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex).then(
      () => toastSuccess(`Copied ${hex}`),
      () => toastError("Copy failed.")
    );
  }, []);

  const activeStep = colors.length ? 2 : uploaded ? 1 : 0;

  return (
    <ToolPage toolId="palette" activeStep={activeStep}>
      <ImageUpload image={uploaded} onImage={setUploaded} onClear={() => setUploaded(null)} />
      {uploaded && (
        <div className="photo-tool-controls">
          {loading && <p className="photo-tool-controls__empty">Finding colors…</p>}
          {!loading && colors.length === 0 && (
            <p className="photo-tool-controls__empty">No colors found. Try a different photo.</p>
          )}
          {!loading && colors.length > 0 && (
            <>
              <p className="photo-tool-controls__empty">Tap a color to copy its code.</p>
              <div className="photo-tool-controls__palette">
                {colors.map((c) => (
                  <button key={c.hex} type="button" className="photo-tool-controls__swatch" onClick={() => copyColor(c.hex)}>
                    <span className="photo-tool-controls__swatch-color" style={{ backgroundColor: c.hex }} />
                    {c.hex}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ToolPage>
  );
}
