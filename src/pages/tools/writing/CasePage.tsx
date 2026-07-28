import { useState, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { transformCase, CASE_MODE_LABELS, type CaseMode } from "../../../utils/tools/textCase";
import "../shared/TextTool.scss";

const MODES: CaseMode[] = ["upper", "lower", "title", "sentence", "camel", "pascal", "snake", "kebab"];

export function CasePage() {
  const [input, setInput] = useState("Hello world example");
  const [mode, setMode] = useState<CaseMode>("title");

  const output = useMemo(() => transformCase(input, mode), [input, mode]);
  const activeStep = output && input.trim() ? 2 : input.trim() ? 1 : 0;

  return (
    <ToolPage toolId="case" activeStep={activeStep}>
      <div className="text-tool">
        <div className="text-tool__modes" role="group" aria-label="Case style">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              className={`text-tool__mode ${mode === m ? "text-tool__mode--active" : ""}`}
              onClick={() => setMode(m)}
            >
              {CASE_MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <CopyField
          id="case-input"
          label="Your text"
          value={input}
          onChange={setInput}
          placeholder="Enter text to transform"
          rows={4}
        />

        <CopyField
          id="case-output"
          label="Result"
          value={output}
          readOnly
          rows={4}
          placeholder="Transformed text will appear here"
        />
      </div>
    </ToolPage>
  );
}
