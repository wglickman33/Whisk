import { useState, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { ToolOutput } from "../../../components/tools/ToolOutput";
import { useBlobUrl } from "../../../hooks/useBlobUrl";
import { getOutputMimeType } from "../../../utils/canvasUtils";
import { loadImageElement, imageToCanvas, canvasToBlob } from "../../../utils/tools/imageCanvas";
import { applyFilter, type FilterPreset } from "../../../utils/tools/imageFilters";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "../shared/PhotoToolControls.scss";

const PRESETS: { id: FilterPreset; label: string }[] = [
  { id: "grayscale", label: "Black & white" },
  { id: "sepia", label: "Sepia tone" },
];

export function FiltersPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [preset, setPreset] = useState<FilterPreset>("grayscale");
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResult } = useBlobUrl();
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleApply = useCallback(async () => {
    if (!uploaded || processing) return;
    setProcessing(true);
    try {
      const img = await loadImageElement(uploaded.objectUrl);
      const canvas = await imageToCanvas(img);
      const ctx = canvas.getContext("2d")!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.putImageData(applyFilter(imageData, preset), 0, 0);
      const mime = getOutputMimeType(uploaded.file.type);
      const blob = await canvasToBlob(canvas, mime);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Your filtered photo is ready to download.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not apply this filter.");
    } finally {
      setProcessing(false);
    }
  }, [uploaded, preset, processing, setResultUrl]);

  const ext = uploaded?.file.type === "image/png" ? "png" : "jpg";
  const outName = uploaded?.file.name.replace(/\.[^.]+$/, `-${preset}.${ext}`) ?? "filtered.jpg";
  const activeStep = resultUrl ? 2 : uploaded ? 1 : 0;

  return (
    <ToolPage
      toolId="filters"
      activeStep={activeStep}
      primaryAction={
        uploaded && !resultUrl
          ? { label: processing ? "Processing…" : "Apply Filter", onClick: handleApply, disabled: processing }
          : undefined
      }
    >
      <ImageUpload image={uploaded} onImage={(i) => { setUploaded(i); clearResult(); }} onClear={() => { setUploaded(null); clearResult(); }} />
      {uploaded && !resultUrl && (
        <div className="photo-tool-controls">
          <p className="photo-tool-controls__empty">Pick a look for your photo.</p>
          <div className="photo-tool-controls__options" role="group" aria-label="Filter presets">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className={`photo-tool-controls__option ${preset === p.id ? "photo-tool-controls__option--active" : ""}`} onClick={() => setPreset(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {resultUrl && (
        <ToolOutput src={resultUrl} filename={outName} mimeType={getOutputMimeType(uploaded?.file.type ?? "")} originalSize={uploaded?.file.size} resultSize={resultSize} label="Filtered photo" />
      )}
    </ToolPage>
  );
}
