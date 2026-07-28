import { useState, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { csvToJson, jsonToCsv, validateCsv, formatCsvPreview } from "../../../utils/tools/csvFormat";
import "../shared/TextTool.scss";

type CsvMode = "validate" | "to-json" | "to-csv" | "preview";

export function CsvPage() {
  const [input, setInput] = useState("name,qty\napple,2\nbanana,1");
  const [mode, setMode] = useState<CsvMode>("to-json");

  const result = useMemo(() => {
    switch (mode) {
      case "validate":
        return validateCsv(input);
      case "to-json":
        return csvToJson(input);
      case "to-csv":
        return jsonToCsv(input);
      case "preview":
        return formatCsvPreview(input);
    }
  }, [input, mode]);

  const activeStep = result.ok ? 2 : input.trim() ? 1 : 0;

  return (
    <ToolPage toolId="csv" activeStep={activeStep}>
      <div className="text-tool">
        <div className="text-tool__modes" role="group" aria-label="CSV action">
          <button
            type="button"
            className={`text-tool__mode ${mode === "validate" ? "text-tool__mode--active" : ""}`}
            onClick={() => setMode("validate")}
          >
            Validate
          </button>
          <button
            type="button"
            className={`text-tool__mode ${mode === "to-json" ? "text-tool__mode--active" : ""}`}
            onClick={() => setMode("to-json")}
          >
            CSV → JSON
          </button>
          <button
            type="button"
            className={`text-tool__mode ${mode === "to-csv" ? "text-tool__mode--active" : ""}`}
            onClick={() => setMode("to-csv")}
          >
            JSON → CSV
          </button>
          <button
            type="button"
            className={`text-tool__mode ${mode === "preview" ? "text-tool__mode--active" : ""}`}
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>

        <CopyField
          id="csv-input"
          label={mode === "to-csv" ? "Your JSON" : "Your CSV"}
          value={input}
          onChange={setInput}
          placeholder={
            mode === "to-csv"
              ? '[{"name":"apple","qty":2}]'
              : "name,qty\napple,2"
          }
          rows={8}
        />

        <CopyField
          id="csv-output"
          label={result.ok ? "Result" : "Output"}
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
