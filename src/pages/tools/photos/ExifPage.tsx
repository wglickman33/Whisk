import { useState, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { ToolOutput } from "../../../components/tools/ToolOutput";
import { useBlobUrl } from "../../../hooks/useBlobUrl";
import { getOutputMimeType } from "../../../utils/canvasUtils";
import { formatExifFields, readExifFromFile, type ExifDisplayField } from "../../../utils/tools/exifReader";
import { loadImageElement, imageToCanvas, canvasToBlob } from "../../../utils/tools/imageCanvas";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "../shared/PhotoToolControls.scss";

export function ExifPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [fields, setFields] = useState<ExifDisplayField[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResult } = useBlobUrl();
  const [resultSize, setResultSize] = useState(0);
  const [processing, setProcessing] = useState(false);

  const loadExif = useCallback(async (file: File) => {
    setLoadingMeta(true);
    try {
      const data = await readExifFromFile(file);
      setFields(formatExifFields(data));
    } catch {
      setFields([]);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  const handleImage = useCallback(
    (img: UploadedImage) => {
      setUploaded(img);
      clearResult();
      loadExif(img.file);
    },
    [clearResult, loadExif]
  );

  const handleStrip = useCallback(async () => {
    if (!uploaded || processing) return;
    setProcessing(true);
    try {
      const img = await loadImageElement(uploaded.objectUrl);
      const canvas = await imageToCanvas(img);
      const mime = getOutputMimeType(uploaded.file.type);
      const blob = await canvasToBlob(canvas, mime);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Metadata removed. Download your clean photo.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not strip metadata.");
    } finally {
      setProcessing(false);
    }
  }, [uploaded, processing, setResultUrl]);

  const ext = uploaded?.file.type === "image/png" ? "png" : "jpg";
  const outName = uploaded?.file.name.replace(/\.[^.]+$/, `-clean.${ext}`) ?? "clean.jpg";
  const activeStep = resultUrl ? 2 : uploaded ? 1 : 0;

  return (
    <ToolPage
      toolId="exif"
      activeStep={activeStep}
      primaryAction={
        uploaded && !resultUrl
          ? { label: processing ? "Processing…" : "Remove Metadata & Download", onClick: handleStrip, disabled: processing }
          : undefined
      }
    >
      <ImageUpload image={uploaded} onImage={handleImage} onClear={() => { setUploaded(null); setFields([]); clearResult(); }} />
      {uploaded && !resultUrl && (
        <div className="photo-tool-controls">
          <h2 className="photo-tool-controls__empty" style={{ fontWeight: 600, color: "var(--text)" }}>Photo info</h2>
          {loadingMeta && <p className="photo-tool-controls__empty">Reading photo info…</p>}
          {!loadingMeta && fields.length === 0 && (
            <p className="photo-tool-controls__empty">No camera info found in this photo. You can still remove hidden metadata by downloading a clean copy.</p>
          )}
          {!loadingMeta && fields.length > 0 && (
            <ul className="photo-tool-controls__exif">
              {fields.map((f) => (
                <li key={f.label}>
                  <span>{f.label}</span>
                  <span>{f.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {resultUrl && (
        <ToolOutput src={resultUrl} filename={outName} mimeType={getOutputMimeType(uploaded?.file.type ?? "")} originalSize={uploaded?.file.size} resultSize={resultSize} label="Photo without metadata" />
      )}
    </ToolPage>
  );
}
