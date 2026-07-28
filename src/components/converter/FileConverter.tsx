import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { IconUpload, IconArrow, IconDownload } from "../ui/ConverterIcons";
import { toastSuccess, toastError } from "../../store/toastStore";
import { convert, getSupportedOutputFormats } from "../../converters/core/conversionEngine";
import { fileToFileData, downloadFileData } from "../../converters/utils/fileUtils";
import { validateFileForConverter } from "../../utils/fileSecurity";
import { CATEGORY_ORDER, CATEGORY_LABELS, groupOutputsByCategory } from "./groupOutputFormats";
import type { FileData, ConversionStatus } from "../../converters/core/types";
import "./FileConverter.scss";

export function FileConverter() {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>("");
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [resultFile, setResultFile] = useState<FileData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const validation = await validateFileForConverter(file);
    if (!validation.ok) {
      toastError(validation.error ?? "File rejected.");
      return;
    }
    setInputFile(file);
    setOutputFormat("");
    setResultFile(null);
    setStatus("idle");
    const data = await fileToFileData(file);
    setFileData(data);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleConvert = async () => {
    if (!fileData || !outputFormat) return;
    setStatus("loading");
    setProgress(0);
    setResultFile(null);

    setStatus("converting");
    const result = await convert(fileData, outputFormat, (p) =>
      setProgress(Math.round(p * 100))
    );

    if (result.success && result.file) {
      setResultFile(result.file);
      setStatus("done");
      setProgress(100);
      toastSuccess("Converted. Ready to download.");
    } else {
      toastError(result.error ?? "Conversion failed.");
      setStatus("error");
    }
  };

  const supportedOutputs = fileData ? getSupportedOutputFormats(fileData.extension) : [];
  const filteredOutputs = outputFormat
    ? supportedOutputs
    : supportedOutputs.filter((ext) => ext.includes(searchQuery.toLowerCase()));
  const groupedOutputs = groupOutputsByCategory(filteredOutputs);

  const inputExt = fileData?.extension.toUpperCase() ?? "";

  return (
    <div className="file-converter">
      <header className="file-converter__header">
        <div className="file-converter__header-row">
          <h1 className="file-converter__title">File Converter</h1>
          <span className="file-converter__badge">Processed on your device</span>
        </div>
        <p className="file-converter__subtitle">
          Drop any file. Pick a format. Done.{" "}
          <Link to="/capabilities" className="file-converter__capabilities-link">
            See all formats
          </Link>
        </p>
      </header>

      <div className="file-converter__workspace">
        <div className="file-converter__left">
          <div
            role="button"
            tabIndex={0}
            className={`dropzone ${isDragging ? "dropzone--dragging" : ""} ${inputFile ? "dropzone--filled" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Drop file here or click to browse"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="dropzone__input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              aria-hidden
            />
            {inputFile ? (
              <div className="dropzone__filled">
                <div className="dropzone__badge">{inputExt}</div>
                <span className="dropzone__filename">{inputFile.name}</span>
                <span className="dropzone__size">
                  {(inputFile.size / 1024).toFixed(1)} KB
                </span>
                <button
                  type="button"
                  className="dropzone__change"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInputFile(null);
                    setFileData(null);
                    setResultFile(null);
                    setStatus("idle");
                  }}
                >
                  Change file
                </button>
              </div>
            ) : (
              <div className="dropzone__empty">
                <IconUpload />
                <span className="dropzone__label">Drop file here</span>
                <span className="dropzone__hint">or click to browse</span>
              </div>
            )}
          </div>

          {fileData && (
            <div className="file-info">
              <span className="file-info__label">Detected</span>
              <span className="file-info__value">{fileData.extension.toUpperCase()}</span>
              <span className="file-info__sep">/</span>
              <span className="file-info__mime">{fileData.mimeType}</span>
            </div>
          )}
        </div>

        <div className="file-converter__right">
          {!fileData ? (
            <div className="format-empty">
              <span>Upload a file to see available output formats.</span>
              <Link to="/capabilities#supported" className="format-empty__link">
                View supported formats
              </Link>
            </div>
          ) : supportedOutputs.length === 0 ? (
            <div className="format-empty">
              <span>
                No conversions available for <strong>{inputExt}</strong> files.
              </span>
              <Link to="/capabilities#unsupported" className="format-empty__link">
                See what we can't convert
              </Link>
            </div>
          ) : (
            <>
              <div className="format-panel">
                <div className="format-panel__header">
                  <span className="format-panel__title">Convert to</span>
                  <input
                    type="search"
                    className="format-search"
                    placeholder="Search formats..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setOutputFormat("");
                    }}
                    aria-label="Search output formats"
                  />
                </div>

                <div className="format-grid">
                  {CATEGORY_ORDER.map((cat) => {
                    const formats = groupedOutputs[cat];
                    if (!formats?.length) return null;
                    return (
                      <div key={cat} className="format-group">
                        <span className="format-group__label">{CATEGORY_LABELS[cat]}</span>
                        <div className="format-group__options">
                          {formats.map((ext) => (
                            <button
                              key={ext}
                              type="button"
                              className={`format-chip ${outputFormat === ext ? "format-chip--selected" : ""}`}
                              onClick={() => {
                                setOutputFormat(ext);
                                setSearchQuery("");
                                setResultFile(null);
                                setStatus("idle");
                              }}
                            >
                              {ext.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="convert-actions">
                {outputFormat && (
                  <div className="conversion-summary">
                    <span className="conversion-summary__from">{inputExt}</span>
                    <IconArrow />
                    <span className="conversion-summary__to">{outputFormat.toUpperCase()}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="convert-btn"
                  disabled={!outputFormat || status === "converting" || status === "loading"}
                  onClick={handleConvert}
                >
                  {status === "converting" || status === "loading" ? "Converting..." : "Convert"}
                </button>

                {(status === "converting" || status === "loading") && (
                  <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
                  </div>
                )}

                {status === "done" && resultFile && (
                  <button
                    type="button"
                    className="download-btn"
                    onClick={() => downloadFileData(resultFile)}
                  >
                    <IconDownload />
                    Download {resultFile.name}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

