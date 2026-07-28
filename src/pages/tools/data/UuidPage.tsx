import { useState, useCallback } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { CopyField } from "../../../components/tools/CopyField";
import { generateUuids } from "../../../utils/tools/uuid";
import { toastSuccess } from "../../../store/toastStore";
import "./UuidPage.scss";

export function UuidPage() {
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);

  const handleGenerate = useCallback(() => {
    setUuids(generateUuids(count));
    toastSuccess(`Generated ${Math.min(count, 100)} ID${count === 1 ? "" : "s"}.`);
  }, [count]);

  const output = uuids.join("\n");
  const activeStep = uuids.length ? 2 : 0;

  return (
    <ToolPage
      toolId="uuid"
      activeStep={activeStep}
      primaryAction={{ label: "Generate IDs", onClick: handleGenerate }}
    >
      <div className="uuid-tool">
        <label className="uuid-tool__count">
          <span>How many IDs?</span>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
          />
        </label>

        {uuids.length > 0 && (
          <CopyField
            id="uuid-output"
            label="Your unique IDs"
            value={output}
            readOnly
            rows={Math.min(uuids.length + 1, 12)}
          />
        )}
      </div>
    </ToolPage>
  );
}
