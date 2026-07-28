import { useState, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { yamlToJson, jsonToYaml } from "../../../utils/tools/yamlJson";
import "../shared/TextTool.scss";

export function YamlPage() {
  const [input, setInput] = useState("name: Whisk\nfree: true");
  const [mode, setMode] = useState<"to-json" | "to-yaml">("to-json");

  const result = useMemo(
    () => (mode === "to-json" ? yamlToJson(input) : jsonToYaml(input)),
    [input, mode]
  );

  const activeStep = result.ok ? 2 : input.trim() ? 1 : 0;

  return (
    <ToolPage toolId="yaml" activeStep={activeStep}>
      <div className="text-tool">
        <div className="text-tool__modes" role="group" aria-label="Conversion direction">
          <button
            type="button"
            className={`text-tool__mode ${mode === "to-json" ? "text-tool__mode--active" : ""}`}
            onClick={() => setMode("to-json")}
          >
            YAML → JSON
          </button>
          <button
            type="button"
            className={`text-tool__mode ${mode === "to-yaml" ? "text-tool__mode--active" : ""}`}
            onClick={() => setMode("to-yaml")}
          >
            JSON → YAML
          </button>
        </div>

        <CopyField
          id="yaml-input"
          label={mode === "to-json" ? "Your YAML" : "Your JSON"}
          value={input}
          onChange={setInput}
          placeholder={mode === "to-json" ? "Paste YAML here" : 'Paste JSON here, e.g. {"key":"value"}'}
          rows={8}
        />

        <CopyField
          id="yaml-output"
          label={result.ok ? "Converted result" : "Result"}
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
