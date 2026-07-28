import { useState, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { fromUnix, toUnix, nowTimestampInfo } from "../../../utils/tools/timestamp";
import "../shared/TextTool.scss";

type TimestampMode = "from-unix" | "to-unix";

export function TimestampPage() {
  const [mode, setMode] = useState<TimestampMode>("from-unix");
  const [input, setInput] = useState("1704067200");
  const [useMillis, setUseMillis] = useState(false);
  const [nowInfo, setNowInfo] = useState<ReturnType<typeof nowTimestampInfo> | null>(null);

  const result = useMemo(() => {
    if (mode === "from-unix") return fromUnix(input, useMillis);
    return toUnix(input);
  }, [input, mode, useMillis]);

  const activeStep = result.ok ? 2 : input.trim() ? 1 : 0;

  const handleNow = () => {
    const info = nowTimestampInfo();
    setNowInfo(info);
    setInput(String(info.unixSeconds));
    setMode("from-unix");
    setUseMillis(false);
  };

  return (
    <ToolPage toolId="timestamp" activeStep={activeStep}>
      <div className="text-tool">
        <div className="text-tool__modes" role="group" aria-label="Conversion direction">
          <button
            type="button"
            className={`text-tool__mode ${mode === "from-unix" ? "text-tool__mode--active" : ""}`}
            onClick={() => setMode("from-unix")}
          >
            Unix → Date
          </button>
          <button
            type="button"
            className={`text-tool__mode ${mode === "to-unix" ? "text-tool__mode--active" : ""}`}
            onClick={() => setMode("to-unix")}
          >
            Date → Unix
          </button>
        </div>

        <div className="text-tool__now">
          <button type="button" className="text-tool__now-btn" onClick={handleNow}>
            Use current time
          </button>
          {nowInfo && (
            <span className="text-tool__summary">
              Now: {nowInfo.unixSeconds}s · {nowInfo.iso}
            </span>
          )}
        </div>

        {mode === "from-unix" && (
          <label className="text-tool__summary">
            <input
              type="checkbox"
              checked={useMillis}
              onChange={(e) => setUseMillis(e.target.checked)}
            />{" "}
            Input is milliseconds (not seconds)
          </label>
        )}

        <CopyField
          id="timestamp-input"
          label={mode === "from-unix" ? "Unix timestamp" : "Date or time"}
          value={input}
          onChange={setInput}
          placeholder={mode === "from-unix" ? "1704067200" : "2026-07-28T12:00:00"}
          rows={2}
        />

        <CopyField
          id="timestamp-output"
          label={result.ok ? "Converted result" : "Result"}
          value={result.ok ? result.output! : ""}
          readOnly
          error={result.ok ? undefined : result.error}
          rows={4}
          placeholder={input.trim() ? "Fix errors above to see output" : "Output will appear here"}
        />
      </div>
    </ToolPage>
  );
}
