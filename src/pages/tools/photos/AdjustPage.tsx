import { useState, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { ToolOutput } from "../../../components/tools/ToolOutput";
import { useBlobUrl } from "../../../hooks/useBlobUrl";
import { getOutputMimeType } from "../../../utils/canvasUtils";
import { loadImageElement, imageToCanvas, canvasToBlob } from "../../../utils/tools/imageCanvas";
import { applyAdjustments } from "../../../utils/tools/imageAdjust";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "../shared/PhotoToolControls.scss";

export function AdjustPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
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
  }, [clearResult]);

  const handleApply = useCallback(async () => {
    if (!uploaded || processing) return;
    setProcessing(true);
    try {
      const img = await loadImageElement(uploaded.objectUrl);
      const canvas = await imageToCanvas(img);
      const ctx = canvas.getContext("2d")!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.putImageData(
        applyAdjustments(imageData, { brightness, contrast, saturation }),
        0,
        0
      );
      const mime = getOutputMimeType(uploaded.file.type);
      const blob = await canvasToBlob(canvas, mime);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Your adjusted photo is ready to download.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not adjust this photo.");
    } finally {
      setProcessing(false);
    }
  }, [uploaded, brightness, contrast, saturation, processing, setResultUrl]);

  const ext = uploaded?.file.type === "image/png" ? "png" : "jpg";
  const outName = uploaded?.file.name.replace(/\.[^.]+$/, `-adjusted.${ext}`) ?? "adjusted.jpg";
  const activeStep = resultUrl ? 2 : uploaded ? 1 : 0;

  return (
    <ToolPage
      toolId="adjust"
      activeStep={activeStep}
      primaryAction={
        uploaded && !resultUrl
          ? { label: processing ? "Processing…" : "Apply Adjustments", onClick: handleApply, disabled: processing }
          : undefined
      }
    >
      <ImageUpload image={uploaded} onImage={handleImage} onClear={handleClear} />
      {uploaded && !resultUrl && (
        <div className="photo-tool-controls">
          <Slider label="Brightness" value={brightness} onChange={setBrightness} min={-100} max={100} />
          <Slider label="Contrast" value={contrast} onChange={setContrast} min={-100} max={100} />
          <Slider label="Saturation" value={saturation} onChange={setSaturation} min={-100} max={100} />
        </div>
      )}
      {resultUrl && (
        <ToolOutput src={resultUrl} filename={outName} mimeType={getOutputMimeType(uploaded?.file.type ?? "")} originalSize={uploaded?.file.size} resultSize={resultSize} label="Adjusted photo" />
      )}
    </ToolPage>
  );
}

function Slider({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <label className="photo-tool-controls__slider">
      <span>{label}: {value > 0 ? `+${value}` : value}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
