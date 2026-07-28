import { useState, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { ToolOutput } from "../../../components/tools/ToolOutput";
import { useBlobUrl } from "../../../hooks/useBlobUrl";
import { rotateImage, type RotateAction } from "../../../utils/tools/rotateImage";
import { getOutputMimeType } from "../../../utils/canvasUtils";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "./RotatePage.scss";

const ACTIONS: { id: RotateAction; label: string }[] = [
  { id: "rotate-90", label: "Rotate 90° right" },
  { id: "rotate-180", label: "Rotate 180°" },
  { id: "rotate-270", label: "Rotate 90° left" },
  { id: "flip-h", label: "Flip horizontally" },
  { id: "flip-v", label: "Flip vertically" },
];

export function RotatePage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [action, setAction] = useState<RotateAction>("rotate-90");
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
    setResultSize(0);
  }, [clearResult]);

  const handleApply = useCallback(async () => {
    if (!uploaded || processing) return;
    setProcessing(true);
    try {
      const mimeType = getOutputMimeType(uploaded.file.type);
      const blob = await rotateImage(uploaded.objectUrl, action, mimeType);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Your photo is ready to download.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not transform this photo. Try again.");
    } finally {
      setProcessing(false);
    }
  }, [uploaded, action, processing, setResultUrl]);

  const ext = uploaded?.file.type === "image/png" ? "png" : "jpg";
  const suffix = action.replace("rotate-", "rot").replace("flip-", "flip-");
  const outName = uploaded
    ? uploaded.file.name.replace(/\.[^.]+$/, `-${suffix}.${ext}`)
    : `rotated.${ext}`;

  const activeStep = resultUrl ? 2 : uploaded ? 1 : 0;

  return (
    <ToolPage
      toolId="rotate"
      activeStep={activeStep}
      primaryAction={
        uploaded && !resultUrl
          ? {
              label: processing ? "Processing…" : "Transform Photo",
              onClick: handleApply,
              disabled: processing,
            }
          : undefined
      }
    >
      <ImageUpload image={uploaded} onImage={handleImage} onClear={handleClear} />

      {uploaded && !resultUrl && (
        <div className="rotate-controls">
          <p className="rotate-controls__hint">Choose how you want to turn or flip your photo.</p>
          <div className="rotate-controls__options" role="group" aria-label="Transform options">
            {ACTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`rotate-controls__option ${action === id ? "rotate-controls__option--active" : ""}`}
                onClick={() => setAction(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {resultUrl && (
        <ToolOutput
          src={resultUrl}
          filename={outName}
          mimeType={uploaded?.file.type === "image/png" ? "image/png" : "image/jpeg"}
          originalSize={uploaded?.file.size}
          resultSize={resultSize}
          label="Your transformed photo"
        />
      )}
    </ToolPage>
  );
}
