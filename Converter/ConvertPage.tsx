import { useState, useCallback, useRef } from "react";
import { convert, getSupportedOutputFormats } from "../converters/core/conversionEngine";
import { fileToFileData, downloadFileData, formatsByCategory, CATEGORY_LABELS } from "../converters/utils/fileUtils";
import type { FileData, ConversionStatus, FormatCategory } from "../converters/core/types";
import "./ConvertPage.scss";

const CATEGORY_ORDER: FormatCategory[] = ["image", "audio", "video", "document", "data"];

export default function ConvertPage() {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>("");
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [resultFile, setResultFile] = useState<FileData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setInputFile(file);
    setOutputFormat("");
    setResultFile(null);
    setError("");
    setStatus("idle");
    const data = await fileToFileData(file);
    setFileData(data);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleConvert = async () => {
    if (!fileData || !outputFormat) return;
    setStatus("loading");
    setProgress(0);
    setError("");
    setResultFile(null);

    setStatus("converting");
    const result = await convert(fileData, outputFormat, (p) => setProgress(Math.round(p * 100)));

    if (result.success && result.file) {
      setResultFile(result.file);
      setStatus("done");
      setProgress(100);
    } else {
      setError(result.error ?? "Conversion failed.");
      setStatus("error");
    }
  };

  const supportedOutputs = fileData ? getSupportedOutputFormats(fileData.extension) : [];
  const catalog = formatsByCategory();

  const filteredOutputs = outputFormat ? supportedOutputs : supportedOutputs.filter((ext) =>
    ext.includes(searchQuery.toLowerCase())
  );

  const groupedOutputs: Partial<Record<FormatCategory, string[]>> = {};
  for (const cat of CATEGORY_ORDER) {
    const matches = catalog[cat]
      .map((f) => f.extension)
      .filter((ext) => filteredOutputs.includes(ext));
    if (matches.length) groupedOutputs[cat] = matches;
  }

  const inputExt = fileData?.extension.toUpperCase() ?? "";

  return (
    <div className="convert-page">
      <header className="convert-header">
        <h1 className="convert-title">Convert</h1>
        <p className="convert-subtitle">
          Drop any file. Pick a format. Done.
        </p>
      </header>

      <div className="convert-workspace">
        {/* Left column */}
        <div className="convert-left">
          <div
            className={`dropzone ${isDragging ? "dropzone--dragging" : ""} ${inputFile ? "dropzone--filled" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="dropzone__input"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {inputFile ? (
              <div className="dropzone__filled">
                <div className="dropzone__badge">{inputExt}</div>
                <span className="dropzone__filename">{inputFile.name}</span>
                <span className="dropzone__size">
                  {(inputFile.size / 1024).toFixed(1)} KB
                </span>
                <button
                  className="dropzone__change"
                  onClick={(e) => { e.stopPropagation(); setInputFile(null); setFileData(null); setResultFile(null); setStatus("idle"); }}
                >
                  Change file
                </button>
              </div>
            ) : (
              <div className="dropzone__empty">
                <UploadIcon />
                <span className="dropzone__label">Drop file here</span>
                <span className="dropzone__hint">or click to browse</span>
              </div>
            )}
          </div>

          {/* File detected info */}
          {fileData && (
            <div className="file-info">
              <span className="file-info__label">Detected</span>
              <span className="file-info__value">{fileData.extension.toUpperCase()}</span>
              <span className="file-info__sep">/</span>
              <span className="file-info__mime">{fileData.mimeType}</span>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="convert-right">
          {!fileData ? (
            <div className="format-empty">
              <span>Upload a file to see available output formats</span>
            </div>
          ) : (
            <>
              <div className="format-panel">
                <div className="format-panel__header">
                  <span className="format-panel__title">Convert to</span>
                  <input
                    className="format-search"
                    placeholder="Search formats..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setOutputFormat(""); }}
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
                              className={`format-chip ${outputFormat === ext ? "format-chip--selected" : ""}`}
                              onClick={() => { setOutputFormat(ext); setSearchQuery(""); setResultFile(null); setStatus("idle"); }}
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
                    <ArrowIcon />
                    <span className="conversion-summary__to">{outputFormat.toUpperCase()}</span>
                  </div>
                )}

                <button
                  className="convert-btn"
                  disabled={!outputFormat || status === "converting" || status === "loading"}
                  onClick={handleConvert}
                >
                  {status === "converting" || status === "loading" ? "Converting..." : "Convert"}
                </button>

                {(status === "converting" || status === "loading") && (
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
                  </div>
                )}

                {status === "error" && (
                  <div className="convert-error">{error}</div>
                )}

                {status === "done" && resultFile && (
                  <button
                    className="download-btn"
                    onClick={() => downloadFileData(resultFile)}
                  >
                    <DownloadIcon />
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

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
