import { useState, useCallback, useRef } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { ToolOutput } from "../../../components/tools/ToolOutput";
import { useBlobUrl } from "../../../hooks/useBlobUrl";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "./RemoveBgPage.scss";

export function RemoveBgPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResult } = useBlobUrl();
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleImage = useCallback(
    (img: UploadedImage) => {
      abortRef.current?.abort();
      setUploaded(img);
      clearResult();
      setResultSize(0);
      setProgress("");
    },
    [clearResult]
  );

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    setUploaded(null);
    clearResult();
    setResultSize(0);
    setProgress("");
    setProcessing(false);
  }, [clearResult]);

  const handleRemove = useCallback(async () => {
    if (!uploaded || processing) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setProcessing(true);
    setProgress("Getting ready…");

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      if (controller.signal.aborted) return;
      setProgress("Removing background…");
      const blob = await removeBackground(uploaded.file, {
        progress: (_key: string, current: number, total: number) => {
          if (total > 0 && !controller.signal.aborted) {
            setProgress(`Removing background… ${Math.round((current / total) * 100)}%`);
          }
        },
      });
      if (controller.signal.aborted) return;
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Background removed. Ready to download.");
    } catch (err) {
      if (controller.signal.aborted) return;
      toastError("Could not remove the background. Try a smaller photo or check your connection.");
    } finally {
      if (!controller.signal.aborted) {
        setProcessing(false);
        setProgress("");
      }
    }
  }, [uploaded, processing, setResultUrl]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setProcessing(false);
    setProgress("");
  }, []);

  const outName = uploaded
    ? uploaded.file.name.replace(/\.[^.]+$/, "-nobg.png")
    : "nobg.png";

  const activeStep = resultUrl ? 2 : uploaded ? 1 : 0;

  return (
    <ToolPage
      toolId="remove-bg"
      activeStep={activeStep}
      primaryAction={
        uploaded && !resultUrl
          ? processing
            ? { label: "Cancel", onClick: handleCancel }
            : { label: "Remove Background", onClick: handleRemove }
          : undefined
      }
    >
      <ImageUpload image={uploaded} onImage={handleImage} onClear={handleClear} />

      {uploaded && !resultUrl && (
        <div className="removebg-controls">
          <p className="removebg-controls__note">
            The first time may take a minute while your browser downloads the tool. After that, it works offline.
          </p>
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
