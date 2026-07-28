import { useState, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { ToolOutput } from "../../../components/tools/ToolOutput";
import { useBlobUrl } from "../../../hooks/useBlobUrl";
import { getOutputMimeType } from "../../../utils/canvasUtils";
import { loadImageElement, imageToCanvas, canvasToBlob } from "../../../utils/tools/imageCanvas";
import { drawWatermark } from "../../../utils/tools/imageWatermark";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "../shared/PhotoToolControls.scss";

export function WatermarkPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [text, setText] = useState("© Whisk");
  const [opacity, setOpacity] = useState(70);
  const [size, setSize] = useState(50);
  const [position, setPosition] = useState<"bottom-right" | "bottom-left" | "center">("bottom-right");
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResult } = useBlobUrl();
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleApply = useCallback(async () => {
    if (!uploaded || !text.trim() || processing) return;
    setProcessing(true);
    try {
      const img = await loadImageElement(uploaded.objectUrl);
      const canvas = await imageToCanvas(img);
      const ctx = canvas.getContext("2d")!;
      drawWatermark(ctx, canvas.width, canvas.height, { text, opacity, size, position });
      const mime = getOutputMimeType(uploaded.file.type);
      const blob = await canvasToBlob(canvas, mime);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Your watermarked photo is ready to download.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not add watermark.");
    } finally {
      setProcessing(false);
    }
  }, [uploaded, text, opacity, size, position, processing, setResultUrl]);

  const ext = uploaded?.file.type === "image/png" ? "png" : "jpg";
  const outName = uploaded?.file.name.replace(/\.[^.]+$/, `-watermarked.${ext}`) ?? "watermarked.jpg";
  const activeStep = resultUrl ? 2 : uploaded && text.trim() ? 1 : uploaded ? 1 : 0;

  return (
    <ToolPage
      toolId="watermark"
      activeStep={activeStep}
      primaryAction={
        uploaded && !resultUrl
          ? { label: processing ? "Processing…" : "Add Watermark", onClick: handleApply, disabled: processing || !text.trim() }
          : undefined
      }
    >
      <ImageUpload image={uploaded} onImage={(i) => { setUploaded(i); clearResult(); }} onClear={() => { setUploaded(null); clearResult(); }} />
      {uploaded && !resultUrl && (
        <div className="photo-tool-controls">
          <label className="photo-tool-controls__slider">
            <span>Watermark text</span>
            <input className="photo-tool-controls__text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Your name or website" maxLength={80} />
          </label>
          <label className="photo-tool-controls__slider">
            <span>Opacity: {opacity}%</span>
            <input type="range" min={20} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
          </label>
          <label className="photo-tool-controls__slider">
            <span>Size: {size}%</span>
            <input type="range" min={25} max={100} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          </label>
          <div className="photo-tool-controls__options" role="group" aria-label="Watermark position">
            {(["bottom-right", "bottom-left", "center"] as const).map((p) => (
              <button key={p} type="button" className={`photo-tool-controls__option ${position === p ? "photo-tool-controls__option--active" : ""}`} onClick={() => setPosition(p)}>
                {p === "bottom-right" ? "Bottom right" : p === "bottom-left" ? "Bottom left" : "Center"}
              </button>
            ))}
          </div>
        </div>
      )}
      {resultUrl && (
        <ToolOutput src={resultUrl} filename={outName} mimeType={getOutputMimeType(uploaded?.file.type ?? "")} originalSize={uploaded?.file.size} resultSize={resultSize} label="Watermarked photo" />
      )}
    </ToolPage>
  );
}
