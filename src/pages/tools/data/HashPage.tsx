import { useState, useEffect, useCallback, useRef } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { hashText, hashFile, type HashAlgorithm } from "../../../utils/tools/hash";
import { toastError } from "../../../store/toastStore";
import "./HashPage.scss";

export function HashPage() {
  const [text, setText] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [hash, setHash] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<File | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (fileRef.current) {
        setLoading(true);
        try {
          const result = await hashFile(fileRef.current, algorithm);
          if (!cancelled) setHash(result);
        } catch {
          if (!cancelled) toastError("Could not hash this file.");
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      if (!text.trim()) {
        setHash("");
        return;
      }

      setLoading(true);
      try {
        const result = await hashText(text, algorithm);
        if (!cancelled) setHash(result);
      } catch {
        if (!cancelled) setHash("");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(run, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, algorithm]);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toastError("Choose a file under 50 MB.");
      return;
    }
    fileRef.current = file;
    setFileName(file.name);
    setText("");
  }, []);

  const clearFile = () => {
    fileRef.current = null;
    setFileName("");
    setHash("");
  };

  const activeStep = hash ? 2 : text.trim() || fileName ? 1 : 0;

  return (
    <ToolPage toolId="hash" activeStep={activeStep}>
      <div className="hash-tool">
        <label className="hash-tool__algo">
          <span>Algorithm</span>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as HashAlgorithm)}
          >
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-512">SHA-512</option>
          </select>
        </label>

        {!fileName && (
          <CopyField
            id="hash-input"
            label="Text to hash"
            value={text}
            onChange={setText}
            rows={4}
            placeholder="Enter any text…"
          />
        )}

        <label className="hash-tool__file">
          <span>Or hash a file (under 50 MB)</span>
          <input type="file" onChange={handleFile} />
        </label>

        {fileName && (
          <p className="hash-tool__file-note">
            Hashing file: {fileName}.{" "}
            <button type="button" className="hash-tool__clear" onClick={clearFile}>
              Clear
            </button>
          </p>
        )}

        <CopyField
          id="hash-output"
          label={loading ? "Computing…" : "Hash result"}
          value={hash}
          readOnly
          rows={3}
          placeholder="Hash will appear here"
        />
      </div>
    </ToolPage>
  );
}
