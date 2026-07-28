import { useState, useCallback, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import {
  encodeTextToBase64,
  decodeBase64ToText,
  fileToBase64,
} from "../../../utils/tools/base64";
import { toastSuccess, toastError } from "../../../store/toastStore";
import "./Base64Page.scss";

export function Base64Page() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [text, setText] = useState("Hello, Whisk!");
  const [fileBase64, setFileBase64] = useState("");

  const textResult = useMemo(() => {
    if (fileBase64) return { ok: true as const, output: fileBase64 };
    return mode === "encode" ? encodeTextToBase64(text) : decodeBase64ToText(text);
  }, [mode, text, fileBase64]);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toastError("Choose a file under 5 MB.");
      return;
    }
    const result = await fileToBase64(file);
    if (!result.ok) {
      toastError(result.error ?? "Could not read this file.");
      return;
    }
    setFileBase64(result.output!);
    setMode("encode");
    toastSuccess("File encoded. Copy the result below.");
  }, []);

  const clearFile = () => setFileBase64("");

  const activeStep = textResult.ok && textResult.output ? 2 : text.trim() || fileBase64 ? 1 : 0;

  return (
    <ToolPage toolId="base64" activeStep={activeStep}>
      <div className="base64-tool">
        <div className="base64-tool__modes" role="group" aria-label="Base64 mode">
          <button
            type="button"
            className={`base64-tool__mode ${mode === "encode" ? "base64-tool__mode--active" : ""}`}
            onClick={() => { setMode("encode"); clearFile(); }}
          >
            Encode to Base64
          </button>
          <button
            type="button"
            className={`base64-tool__mode ${mode === "decode" ? "base64-tool__mode--active" : ""}`}
            onClick={() => { setMode("decode"); clearFile(); }}
          >
            Decode from Base64
          </button>
        </div>

        {mode === "encode" && (
          <label className="base64-tool__file">
            <span>Or encode a small file (under 5 MB)</span>
            <input type="file" onChange={handleFile} />
          </label>
        )}

        {!fileBase64 && (
          <CopyField
            id="base64-input"
            label={mode === "encode" ? "Text to encode" : "Base64 to decode"}
            value={text}
            onChange={setText}
            rows={6}
            placeholder={mode === "encode" ? "Enter text…" : "Paste Base64…"}
          />
        )}

        {fileBase64 && (
          <p className="base64-tool__file-note">
            Showing encoded file.{" "}
            <button type="button" className="base64-tool__clear" onClick={clearFile}>
              Clear file
            </button>
          </p>
        )}

        <CopyField
          id="base64-output"
          label="Result"
          value={textResult.ok ? textResult.output! : ""}
          readOnly
          error={textResult.ok ? undefined : textResult.error}
          rows={6}
          placeholder="Result will appear here"
        />
      </div>
    </ToolPage>
  );
}
