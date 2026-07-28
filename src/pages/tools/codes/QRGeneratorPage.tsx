import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import QRCode from "qrcode";
import { ToolPage } from "../../../components/tools/ToolPage";
import { toastSuccess, toastError } from "../../../store/toastStore";
import {
  buildQrPayload,
  QR_TEMPLATE_LABELS,
  QR_ERROR_LABELS,
  type QrTemplate,
  type QrErrorLevel,
  type WifiEncryption,
} from "../../../utils/tools/qrFormat";
import "./QRGeneratorPage.scss";

const MAX_QR_LENGTH = 2000;
const DEBOUNCE_MS = 400;

export function QRGeneratorPage() {
  const [template, setTemplate] = useState<QrTemplate>("url");
  const [text, setText] = useState("https://example.com");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState<WifiEncryption>("WPA");
  const [errorLevel, setErrorLevel] = useState<QrErrorLevel>("M");
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [size, setSize] = useState(300);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const payloadResult = useMemo(
    () =>
      buildQrPayload({
        template,
        text,
        email,
        phone,
        wifi: {
          ssid: wifiSsid,
          password: wifiPassword,
          encryption: wifiEncryption,
        },
      }),
    [template, text, email, phone, wifiSsid, wifiPassword, wifiEncryption]
  );

  const generate = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!payloadResult.ok || !payloadResult.payload) {
        setDataUrl(null);
        return;
      }
      if (payloadResult.payload.length > MAX_QR_LENGTH) {
        toastError(`Keep your content under ${MAX_QR_LENGTH} characters.`);
        return;
      }
      try {
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, payloadResult.payload, {
            width: size,
            margin: 2,
            errorCorrectionLevel: errorLevel,
            color: { dark: darkColor, light: lightColor },
          });
          setDataUrl(canvasRef.current.toDataURL("image/png"));
          if (!opts?.silent) toastSuccess("Your QR code is ready to download.");
        }
      } catch {
        toastError("Could not make a QR code from this content. Try something shorter.");
        setDataUrl(null);
      }
    },
    [payloadResult, size, errorLevel, darkColor, lightColor]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!payloadResult.ok) {
      setDataUrl(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      generate({ silent: true });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [payloadResult, size, errorLevel, darkColor, lightColor, generate]);

  const download = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  }, [dataUrl]);

  const activeStep = dataUrl ? 2 : payloadResult.ok ? 1 : 0;

  return (
    <ToolPage
      toolId="qr"
      activeStep={activeStep}
      primaryAction={
        dataUrl
          ? { label: "Download QR Code", onClick: download }
          : {
              label: "Make QR Code",
              onClick: () => generate(),
              disabled: !payloadResult.ok,
            }
      }
    >
      <div className="qr-gen">
        <div className="qr-gen__input-area">
          <div className="qr-gen__templates" role="group" aria-label="QR code type">
            {(Object.keys(QR_TEMPLATE_LABELS) as QrTemplate[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`qr-gen__template ${template === t ? "qr-gen__template--active" : ""}`}
                onClick={() => setTemplate(t)}
              >
                {QR_TEMPLATE_LABELS[t]}
              </button>
            ))}
          </div>

          {template === "text" && (
            <>
              <label className="qr-gen__label" htmlFor="qr-text">
                Text content
              </label>
              <textarea
                id="qr-text"
                className="qr-gen__textarea"
                placeholder="Any text…"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_QR_LENGTH))}
                rows={3}
              />
            </>
          )}

          {template === "url" && (
            <>
              <label className="qr-gen__label" htmlFor="qr-url">
                Website URL
              </label>
              <input
                id="qr-url"
                type="url"
                className="qr-gen__input"
                placeholder="example.com or https://…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </>
          )}

          {template === "email" && (
            <>
              <label className="qr-gen__label" htmlFor="qr-email">
                Email address
              </label>
              <input
                id="qr-email"
                type="email"
                className="qr-gen__input"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          )}

          {template === "phone" && (
            <>
              <label className="qr-gen__label" htmlFor="qr-phone">
                Phone number
              </label>
              <input
                id="qr-phone"
                type="tel"
                className="qr-gen__input"
                placeholder="+1 555 0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          {template === "wifi" && (
            <div className="qr-gen__wifi">
              <label className="qr-gen__label" htmlFor="qr-ssid">
                Network name (SSID)
              </label>
              <input
                id="qr-ssid"
                className="qr-gen__input"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
              />
              <label className="qr-gen__label" htmlFor="qr-wifi-enc">
                Security
              </label>
              <select
                id="qr-wifi-enc"
                className="qr-gen__input"
                value={wifiEncryption}
                onChange={(e) => setWifiEncryption(e.target.value as WifiEncryption)}
              >
                <option value="WPA">WPA / WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Open (no password)</option>
              </select>
              {wifiEncryption !== "nopass" && (
                <>
                  <label className="qr-gen__label" htmlFor="qr-wifi-pass">
                    Password
                  </label>
                  <input
                    id="qr-wifi-pass"
                    type="password"
                    className="qr-gen__input"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                  />
                </>
              )}
            </div>
          )}

          {!payloadResult.ok && (
            <p className="qr-gen__error" role="alert">
              {payloadResult.error}
            </p>
          )}

          <label className="qr-gen__size">
            <span className="qr-gen__size-label">Size: {size} pixels</span>
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

          <label className="qr-gen__size">
            <span className="qr-gen__size-label">Error correction</span>
            <select
              className="qr-gen__input"
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value as QrErrorLevel)}
            >
              {(Object.keys(QR_ERROR_LABELS) as QrErrorLevel[]).map((level) => (
                <option key={level} value={level}>
                  {QR_ERROR_LABELS[level]}
                </option>
              ))}
            </select>
          </label>

          <div className="qr-gen__colors">
            <label className="qr-gen__color">
              <span>Foreground</span>
              <input type="color" value={darkColor} onChange={(e) => setDarkColor(e.target.value)} />
            </label>
            <label className="qr-gen__color">
              <span>Background</span>
              <input type="color" value={lightColor} onChange={(e) => setLightColor(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="qr-gen__output">
          {dataUrl ? (
            <img src={dataUrl} alt="Your QR code" className="qr-gen__preview" />
          ) : (
            <div className="qr-gen__placeholder">
              {payloadResult.ok ? "Generating preview…" : "Fill in the fields to preview your QR code"}
            </div>
          )}
          <canvas ref={canvasRef} className="qr-gen__canvas" aria-hidden />
        </div>
      </div>
    </ToolPage>
  );
}
