import { useState, useCallback, useRef, useEffect } from "react";
import { IconUpload } from "../ui/ConverterIcons";
import { validateImageForTools } from "../../utils/fileSecurity";
import { checkImageDimensions } from "../../utils/canvasUtils";
import type { UploadedImage } from "./ImageUpload";
import "./MultiImageUpload.scss";

const ACCEPTED = ".png,.jpg,.jpeg,.webp,.bmp,.gif,.heic,.heif";
const MAX_IMAGES = 20;

type Props = {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
};

export function MultiImageUpload({ images, onChange, maxImages = MAX_IMAGES }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = async (file: File): Promise<UploadedImage | null> => {
    const validation = await validateImageForTools(file);
    if (!validation.ok) {
      setError(validation.error ?? "File rejected.");
      return null;
    }
    const url = URL.createObjectURL(file);
    try {
      const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = reject;
        img.src = url;
      });
      const check = checkImageDimensions(dims.width, dims.height);
      if (!check.ok) {
        setError(check.error ?? "Photo too large.");
        URL.revokeObjectURL(url);
        return null;
      }
      return { file, objectUrl: url, ...dims };
    } catch {
      URL.revokeObjectURL(url);
      setError("Could not load image. Try a different file.");
      return null;
    }
  };

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length) return;
      setError("");
      setLoading(true);
      const added: UploadedImage[] = [];
      try {
        for (const file of Array.from(fileList)) {
          if (images.length + added.length >= maxImages) {
            setError(`You can add up to ${maxImages} photos.`);
            break;
          }
          const img = await loadFile(file);
          if (img) added.push(img);
        }
        if (added.length) onChange([...images, ...added]);
      } finally {
        setLoading(false);
      }
    },
    [images, maxImages, onChange]
  );

  const removeAt = (index: number) => {
    const next = [...images];
    const [removed] = next.splice(index, 1);
    if (removed) URL.revokeObjectURL(removed.objectUrl);
    onChange(next);
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.objectUrl));
    onChange([]);
    setError("");
  };

  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.objectUrl));
  }, []);

  return (
    <div className="multi-upload">
      <div
        className="multi-upload__drop"
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="multi-upload__input"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <IconUpload />
        <span>{loading ? "Adding photos…" : "Add photos"}</span>
        <span className="multi-upload__hint">Up to {maxImages} images · PNG, JPG, WebP</span>
      </div>

      {images.length > 0 && (
        <>
          <ul className="multi-upload__list">
            {images.map((img, i) => (
              <li key={img.objectUrl} className="multi-upload__item">
                <img src={img.objectUrl} alt="" className="multi-upload__thumb" />
                <span className="multi-upload__name">{img.file.name}</span>
                <button type="button" className="multi-upload__remove" onClick={() => removeAt(i)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="multi-upload__clear" onClick={clearAll}>
            Clear all
          </button>
        </>
      )}

      {error && (
        <p className="multi-upload__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
