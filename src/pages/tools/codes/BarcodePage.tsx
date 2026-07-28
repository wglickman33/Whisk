import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  BARCODE_FORMAT_LABELS,
  validateBarcodeInput,
  renderBarcodeToCanvas,
  type BarcodeFormat,
} from "../../../utils/tools/barcode";
import { ToolPage } from "../../../components/tools/ToolPage";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "./BarcodePage.scss";

export function BarcodePage() {
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [value, setValue] = useState("WHISK-001");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const validation = useMemo(() => validateBarcodeInput(format, value), [format, value]);

  const generate = useCallback(
    (opts?: { silent?: boolean }) => {
      if (!validation.ok || !validation.value || !canvasRef.current) {
        setDataUrl(null);
        return;
      }
      try {
        renderBarcodeToCanvas(canvasRef.current, validation.value, format);
        setDataUrl(canvasRef.current.toDataURL("image/png"));
        if (!opts?.silent) toastSuccess("Barcode ready to download.");
      } catch {
        setDataUrl(null);
        toastError("Could not generate this barcode. Check the format and value.");
      }
    },
    [validation, format]
  );

  useEffect(() => {
    if (!validation.ok) {
      setDataUrl(null);
      return;
    }
    generate({ silent: true });
  }, [validation, generate]);

  const download = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `barcode-${format.toLowerCase()}.png`;
    a.click();
  }, [dataUrl, format]);

  const activeStep = dataUrl ? 2 : value.trim() ? 1 : 0;

  return (
    <ToolPage
      toolId="barcode"
      activeStep={activeStep}
      primaryAction={
        dataUrl
          ? { label: "Download barcode", onClick: download }
          : {
              label: "Generate barcode",
              onClick: () => generate(),
              disabled: !validation.ok,
            }
      }
    >
      <div className="barcode-tool">
        <label className="barcode-tool__field">
          <span>Barcode type</span>
          <select value={format} onChange={(e) => setFormat(e.target.value as BarcodeFormat)}>
            {(Object.keys(BARCODE_FORMAT_LABELS) as BarcodeFormat[]).map((f) => (
              <option key={f} value={f}>
                {BARCODE_FORMAT_LABELS[f]}
              </option>
            ))}
          </select>
        </label>

        <label className="barcode-tool__field">
          <span>Value to encode</span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={format === "EAN13" ? "5901234123457" : "Enter text or numbers"}
          />
        </label>

        {!validation.ok && value.trim() && (
          <p className="barcode-tool__error" role="alert">
            {validation.error}
          </p>
        )}

        <div className="barcode-tool__output">
          {dataUrl ? (
            <img src={dataUrl} alt="Generated barcode" className="barcode-tool__preview" />
          ) : (
            <div className="barcode-tool__placeholder">
              {value.trim() ? "Generating…" : "Your barcode will appear here"}
            </div>
          )}
          <canvas ref={canvasRef} className="barcode-tool__canvas" aria-hidden />
        </div>
      </div>
    </ToolPage>
  );
}
