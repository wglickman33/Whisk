import { useState, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { countText } from "../../../utils/tools/textCounter";
import "../shared/TextTool.scss";

export function CounterPage() {
  const [input, setInput] = useState("");
  const stats = useMemo(() => countText(input), [input]);
  const activeStep = input.trim() ? 2 : 0;

  return (
    <ToolPage toolId="counter" activeStep={activeStep}>
      <div className="text-tool">
        <CopyField
          id="counter-input"
          label="Your text"
          value={input}
          onChange={setInput}
          placeholder="Type or paste text to count words, characters, and more"
          rows={8}
        />

        {input.trim().length > 0 && (
          <div className="text-tool__stats">
            <div className="text-tool__stat">
              <span className="text-tool__stat-value">{stats.words}</span>
              <span className="text-tool__stat-label">Words</span>
            </div>
            <div className="text-tool__stat">
              <span className="text-tool__stat-value">{stats.characters}</span>
              <span className="text-tool__stat-label">Characters</span>
            </div>
            <div className="text-tool__stat">
              <span className="text-tool__stat-value">{stats.charactersNoSpaces}</span>
              <span className="text-tool__stat-label">No spaces</span>
            </div>
            <div className="text-tool__stat">
              <span className="text-tool__stat-value">{stats.lines}</span>
              <span className="text-tool__stat-label">Lines</span>
            </div>
            <div className="text-tool__stat">
              <span className="text-tool__stat-value">{stats.sentences}</span>
              <span className="text-tool__stat-label">Sentences</span>
            </div>
            <div className="text-tool__stat">
              <span className="text-tool__stat-value">{stats.paragraphs}</span>
              <span className="text-tool__stat-label">Paragraphs</span>
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
