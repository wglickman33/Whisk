import { useState, useCallback, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { ToolPage } from "../../components/tools/ToolPage";
import { toastSuccess, toastError } from "../../store/toastStore";
import "./QRGeneratorPage.scss";

export function QRGeneratorPage() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(300);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = useCallback(async (opts?: { silent?: boolean }) => {
    if (!text.trim()) {
      toastError("Enter some text or a URL.");
      return;
    }
    try {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, text, {
          width: size,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
        setDataUrl(canvasRef.current.toDataURL("image/png"));
        if (!opts?.silent) toastSuccess("QR code generated. Ready to download.");
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to generate QR code.");
    }
  }, [text, size]);

  useEffect(() => {
    if (text.trim()) generate({ silent: true });
  }, [size, generate, text]);

  const download = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  }, [dataUrl]);

  return (
    <ToolPage title="QR Generator" description="Turn any text or URL into a downloadable QR code.">
      <div className="qr-gen">
        <div className="qr-gen__input-area">
          <textarea
            className="qr-gen__textarea"
            placeholder="Enter text or URL..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />

          <label className="qr-gen__size">
            <span className="qr-gen__size-label">Size: {size}px</span>
            <input
              type="range"
              min={100}
              max={800}
              step={50}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="qr-gen__slider"
            />
          </label>

          <button type="button" className="qr-gen__btn" onClick={() => generate()}>
            Generate QR Code
          </button>
        </div>

        <div className="qr-gen__output">
          <canvas ref={canvasRef} className="qr-gen__canvas" />
          {dataUrl && (
            <button type="button" className="qr-gen__download" onClick={download}>
              Download PNG
            </button>
          )}
        </div>
      </div>
    </ToolPage>
  );
}
