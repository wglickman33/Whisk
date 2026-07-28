import { useState, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { diffLines, diffSummary } from "../../../utils/tools/textDiff";
import "../shared/TextTool.scss";

export function DiffPage() {
  const [original, setOriginal] = useState("Line one\nLine two\nLine three");
  const [revised, setRevised] = useState("Line one\nLine two changed\nLine three");

  const lines = useMemo(() => diffLines(original, revised), [original, revised]);
  const summary = useMemo(() => diffSummary(lines), [lines]);
  const hasBoth = original.trim().length > 0 && revised.trim().length > 0;
  const activeStep = hasBoth ? (summary.added + summary.removed > 0 ? 2 : 1) : original.trim() || revised.trim() ? 1 : 0;

  return (
    <ToolPage toolId="diff" activeStep={activeStep}>
      <div className="text-tool">
        <CopyField
          id="diff-original"
          label="Original text"
          value={original}
          onChange={setOriginal}
          placeholder="Paste the original version"
          rows={6}
        />

        <CopyField
          id="diff-revised"
          label="Revised text"
          value={revised}
          onChange={setRevised}
          placeholder="Paste the updated version"
          rows={6}
        />

        {hasBoth && (
          <>
            <p className="text-tool__summary">
              {summary.added} added · {summary.removed} removed · {summary.unchanged} unchanged
            </p>
            <div className="text-tool__diff" aria-label="Line differences">
              {lines.map((line, i) => (
                <div
                  key={`${line.type}-${i}`}
                  className={
                    line.type === "add"
                      ? "text-tool__diff-line--add"
                      : line.type === "remove"
                        ? "text-tool__diff-line--remove"
                        : undefined
                  }
                >
                  {line.type === "same" ? "  " : line.type === "add" ? "+ " : "- "}
                  {line.text || " "}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ToolPage>
  );
}
