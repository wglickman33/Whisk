import { useState, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { formatJson, minifyJson } from "../../../utils/tools/jsonFormat";
import "./JsonPage.scss";

export function JsonPage() {
  const [input, setInput] = useState('{"name":"Whisk","free":true}');
  const [mode, setMode] = useState<"pretty" | "minify">("pretty");

  const result = useMemo(
    () => (mode === "pretty" ? formatJson(input) : minifyJson(input)),
    [input, mode]
  );

  const activeStep = result.ok ? 2 : input.trim() ? 1 : 0;

  return (
    <ToolPage toolId="json" activeStep={activeStep}>
      <div className="json-tool">
        <div className="json-tool__modes" role="group" aria-label="Format mode">
          <button
            type="button"
            className={`json-tool__mode ${mode === "pretty" ? "json-tool__mode--active" : ""}`}
            onClick={() => setMode("pretty")}
          >
            Make readable
          </button>
          <button
            type="button"
            className={`json-tool__mode ${mode === "minify" ? "json-tool__mode--active" : ""}`}
            onClick={() => setMode("minify")}
          >
            Make compact
          </button>
        </div>

        <CopyField
          id="json-input"
          label="Your JSON"
          value={input}
          onChange={setInput}
          placeholder='Paste JSON here, e.g. {"key":"value"}'
          rows={8}
        />

        <CopyField
          id="json-output"
          label={result.ok ? "Formatted result" : "Result"}
          value={result.ok ? result.output! : ""}
          readOnly
          error={result.ok ? undefined : result.error}
          rows={8}
          placeholder={input.trim() ? "Fix errors above to see output" : "Output will appear here"}
        />
      </div>
    </ToolPage>
  );
}
