import { useCallback } from "react";
import { IconDownload } from "../ui/ConverterIcons";
import "./ToolOutput.scss";

interface ToolOutputProps {
  src: string;
  filename: string;
  mimeType?: string;
  originalSize?: number;
  resultSize?: number;
  label?: string;
}

export function ToolOutput({ src, filename, mimeType, originalSize, resultSize, label }: ToolOutputProps) {
  const download = useCallback(() => {
    const a = document.createElement("a");
    a.href = src;
    a.download = filename;
    a.click();
  }, [src, filename]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="tool-output">
      {label && <span className="tool-output__label">{label}</span>}

      <div className="tool-output__preview">
        <img src={src} alt="Result" className="tool-output__image" />
      </div>

      {originalSize != null && resultSize != null && (
        <div className="tool-output__sizes">
          <span>{formatSize(originalSize)}</span>
          <span className="tool-output__arrow">&rarr;</span>
          <span className="tool-output__result-size">{formatSize(resultSize)}</span>
          {resultSize < originalSize && (
            <span className="tool-output__savings">
              &minus;{((1 - resultSize / originalSize) * 100).toFixed(0)}%
            </span>
          )}
        </div>
      )}

      <button type="button" className="tool-output__download" onClick={download}>
        <IconDownload />
        Download {filename}
      </button>

      {mimeType && (
        <span className="tool-output__mime">{mimeType}</span>
      )}
    </div>
  );
}
