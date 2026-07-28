import { useState, useCallback, useRef, useEffect } from "react";
import { IconUpload } from "../ui/ConverterIcons";
import { validateImageForTools } from "../../utils/fileSecurity";
import { checkImageDimensions } from "../../utils/canvasUtils";
import "./ImageUpload.scss";

const ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg,.webp,.bmp,.gif,.heic,.heif";

export interface UploadedImage {
  file: File;
  objectUrl: string;
  width: number;
  height: number;
}

interface ImageUploadProps {
  onImage: (img: UploadedImage) => void;
  onClear?: () => void;
  image: UploadedImage | null;
  label?: string;
  hint?: string;
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  const result = blob instanceof Blob ? blob : (blob as Blob[])[0];
  const name = file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg");
  return new File([result], name, { type: "image/jpeg" });
}

function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

export function ImageUpload({ onImage, onClear, image, label, hint }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError("");
      setLoading(true);

      try {
        let processed = file;
        const isHeic = /\.(heic|heif)$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif";
        if (isHeic) {
          processed = await convertHeicToJpeg(file);
        }

        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        const objectUrl = URL.createObjectURL(processed);
        prevUrlRef.current = objectUrl;

        const dims = await loadImageDimensions(objectUrl);
        const sizeCheck = checkImageDimensions(dims.width, dims.height);
        if (!sizeCheck.ok) {
          URL.revokeObjectURL(objectUrl);
          prevUrlRef.current = null;
          setError(sizeCheck.error ?? "This photo is too large to process.");
          return;
        }
        onImage({ file: processed, objectUrl, ...dims });
      } catch {
        setError("Could not load image. Try a different file.");
      } finally {
        setLoading(false);
      }
    },
    [onImage]
  );

  const handleFile = useCallback(
    async (file: File) => {
      const validation = await validateImageForTools(file);
      if (!validation.ok) {
        setError(validation.error ?? "File rejected.");
        return;
      }
      processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
      onClear?.();
    },
    [onClear]
  );

  return (
    <div className="image-upload">
      <div
        role="button"
        tabIndex={0}
        className={`image-drop ${isDragging ? "image-drop--dragging" : ""} ${image ? "image-drop--filled" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Drop image here or click to browse"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="image-drop__input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
          aria-hidden
        />

        {loading ? (
          <div className="image-drop__loading">Processing...</div>
        ) : image ? (
          <div className="image-drop__preview">
            <img src={image.objectUrl} alt="Uploaded preview" className="image-drop__thumb" />
            <div className="image-drop__meta">
              <span className="image-drop__filename">{image.file.name}</span>
              <span className="image-drop__dims">
                {image.width} &times; {image.height} &middot; {(image.file.size / 1024).toFixed(1)} KB
              </span>
              {/\.gif$/i.test(image.file.name) && (
                <span className="image-drop__gif-note">Animated GIFs export as a single frame.</span>
              )}
            </div>
            <button type="button" className="image-drop__change" onClick={handleClear}>
              Change image
            </button>
          </div>
        ) : (
          <div className="image-drop__empty">
            <IconUpload />
            <span className="image-drop__label">{label ?? "Upload your photo"}</span>
            <span className="image-drop__hint">{hint ?? "Drop it here or click to browse"}</span>
            <span className="image-drop__formats">PNG, JPG, WebP, BMP, GIF, HEIC</span>
          </div>
        )}
      </div>

      {error && <div className="image-upload__error" role="alert">{error}</div>}
    </div>
  );
}
