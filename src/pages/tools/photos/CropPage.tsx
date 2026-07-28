import { useState, useRef, useCallback, useMemo } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { ToolPage } from "../../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../../components/tools/ImageUpload";
import { ToolOutput } from "../../../components/tools/ToolOutput";
import { useBlobUrl } from "../../../hooks/useBlobUrl";
import {
  exportCanvasToBlob,
  getOutputMimeType,
  getSafeCanvasDimensions,
} from "../../../utils/canvasUtils";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "./CropPage.scss";

async function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  mimeType: string
): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const outW = Math.round(crop.width * scaleX);
  const outH = Math.round(crop.height * scaleY);
  const check = getSafeCanvasDimensions(outW, outH);
  if (!check.ok) throw new Error(check.error);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare your photo. Try a different file.");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outW,
    outH
  );
  return exportCanvasToBlob(canvas, mimeType);
}

export function CropPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResult } = useBlobUrl();
  const [resultSize, setResultSize] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImage = useCallback(
    (img: UploadedImage) => {
      setUploaded(img);
      setCrop(undefined);
      setCompletedCrop(null);
      clearResult();
      setResultSize(0);
    },
    [clearResult]
  );

  const handleClear = useCallback(() => {
    setUploaded(null);
    setCrop(undefined);
    setCompletedCrop(null);
    clearResult();
    setResultSize(0);
  }, [clearResult]);

  const handleCrop = useCallback(async () => {
    if (!imgRef.current || !completedCrop || !uploaded) return;
    if (completedCrop.width <= 0 || completedCrop.height <= 0) {
      toastError("Drag to select an area first.");
      return;
    }
    try {
      const mimeType = getOutputMimeType(uploaded.file.type);
      const blob = await getCroppedBlob(imgRef.current, completedCrop, mimeType);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      toastSuccess("Your cropped photo is ready to download.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not crop this photo. Try again.");
    }
  }, [completedCrop, uploaded, setResultUrl]);

  const cropPixels = useMemo(() => {
    if (!imgRef.current || !completedCrop || completedCrop.width <= 0) return null;
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    return {
      w: Math.round(completedCrop.width * scaleX),
      h: Math.round(completedCrop.height * scaleY),
    };
  }, [completedCrop]);

  const ext = uploaded?.file.type === "image/png" ? "png" : "jpg";
  const outName = uploaded
    ? uploaded.file.name.replace(/\.[^.]+$/, `-cropped.${ext}`)
    : `cropped.${ext}`;

  const activeStep = resultUrl ? 2 : uploaded ? 1 : 0;

  return (
    <ToolPage
      toolId="crop"
      activeStep={activeStep}
      primaryAction={
        uploaded && !resultUrl
          ? {
              label: "Crop Photo",
              onClick: handleCrop,
              disabled: !completedCrop || completedCrop.width <= 0 || completedCrop.height <= 0,
            }
          : undefined
      }
    >
      <ImageUpload image={uploaded} onImage={handleImage} onClear={handleClear} />

      {uploaded && !resultUrl && (
        <div className="crop-workspace">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <img
              ref={imgRef}
              src={uploaded.objectUrl}
              alt="Photo to crop"
              className="crop-workspace__source"
            />
          </ReactCrop>

          <div className="crop-workspace__actions">
            <span className="crop-workspace__info">
              {cropPixels
                ? `${cropPixels.w} × ${cropPixels.h} pixels selected`
                : "Drag to select the area you want to keep"}
            </span>
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
          label="Your cropped photo"
        />
      )}
    </ToolPage>
  );
}
