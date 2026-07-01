import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { ToolPage } from "../../components/tools/ToolPage";
import { ImageUpload, type UploadedImage } from "../../components/tools/ImageUpload";
import { ToolOutput } from "../../components/tools/ToolOutput";
import { toastSuccess, toastError } from "../../store/toastStore";
import "./CropPage.scss";

function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  mimeType: string
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      mimeType,
      0.92
    );
  });
}

export function CropPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [resultDims, setResultDims] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleClear = useCallback(() => {
    setUploaded(null);
    setCrop(undefined);
    setCompletedCrop(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }, [resultUrl]);

  const handleCrop = useCallback(async () => {
    if (!imgRef.current || !completedCrop || !uploaded) return;
    try {
      const mimeType = uploaded.file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await getCroppedBlob(imgRef.current, completedCrop, mimeType);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultSize(blob.size);
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      setResultDims({
        w: Math.round(completedCrop.width * scaleX),
        h: Math.round(completedCrop.height * scaleY),
      });
      toastSuccess("Cropped. Ready to download.");
    } catch {
      toastError("Crop failed. Try again.");
    }
  }, [completedCrop, uploaded, resultUrl]);

  const ext = uploaded?.file.type === "image/png" ? "png" : "jpg";
  const outName = uploaded
    ? uploaded.file.name.replace(/\.[^.]+$/, `-cropped.${ext}`)
    : `cropped.${ext}`;

  return (
    <ToolPage title="Crop" description="Upload an image and crop it to the exact area you need.">
      <ImageUpload image={uploaded} onImage={setUploaded} onClear={handleClear} />

      {uploaded && (
        <div className="crop-workspace">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <img
              ref={imgRef}
              src={uploaded.objectUrl}
              alt="Source"
              className="crop-workspace__source"
            />
          </ReactCrop>

          <div className="crop-workspace__actions">
            {completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && (
              <span className="crop-workspace__info">
                {resultDims.w > 0
                  ? `${resultDims.w} × ${resultDims.h}`
                  : "Drag to select crop area"}
              </span>
            )}
            <button
              type="button"
              className="crop-workspace__btn"
              disabled={!completedCrop || completedCrop.width === 0}
              onClick={handleCrop}
            >
              Crop Image
            </button>
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
          label="Cropped result"
        />
      )}
    </ToolPage>
  );
}
