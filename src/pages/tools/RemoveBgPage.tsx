import { useState, useCallback } from "react";
import { ToolPage } from "../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../components/tools/ImageUpload";
import { ToolOutput } from "../../components/tools/ToolOutput";
import { toastSuccess, toastError } from "../../store/toastStore";
import "./RemoveBgPage.scss";

export function RemoveBgPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");

  const handleClear = useCallback(() => {
    setUploaded(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setProgress("");
  }, [resultUrl]);

  const handleRemove = useCallback(async () => {
    if (!uploaded) return;
    setProcessing(true);
    setProgress("Loading model...");

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      setProgress("Processing image...");
      const blob = await removeBackground(uploaded.file, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 100);
            setProgress(`${key}: ${pct}%`);
          }
        },
      });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultSize(blob.size);
      toastSuccess("Background removed. Ready to download.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Background removal failed.");
    } finally {
      setProcessing(false);
      setProgress("");
    }
  }, [uploaded, resultUrl]);

  const outName = uploaded
    ? uploaded.file.name.replace(/\.[^.]+$/, "-nobg.png")
    : "nobg.png";

  return (
    <ToolPage title="Remove Background" description="Automatically remove the background from any image. Runs entirely in your browser.">
      <ImageUpload image={uploaded} onImage={setUploaded} onClear={handleClear} />

      {uploaded && (
        <div className="removebg-controls">
          <button
            type="button"
            className="removebg-controls__btn"
            onClick={handleRemove}
            disabled={processing}
          >
            {processing ? "Processing..." : "Remove Background"}
          </button>

          {progress && <span className="removebg-controls__progress">{progress}</span>}
        </div>
      )}

      {resultUrl && uploaded && (
        <ToolOutput
          src={resultUrl}
          filename={outName}
          mimeType="image/png"
          originalSize={uploaded.file.size}
          resultSize={resultSize}
          label="Background removed"
        />
      )}
    </ToolPage>
  );
}
