import { useState } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { SafeMarkdown } from "../../../components/tools/SafeMarkdown";
import "./MarkdownPage.scss";

const PLACEHOLDER = `# Hello!

This is a **live preview**. Type on the left and see the result on the right.

## Features
- **Bold**, *italic*, ~~strikethrough~~
- [Links](https://example.com)
- Lists (ordered and unordered)
- Code blocks

\`\`\`js
const greeting = "Hello, world!";
console.log(greeting);
\`\`\`

> Blockquotes work too!
`;

export function MarkdownPage() {
  const [md, setMd] = useState(PLACEHOLDER);
  const activeStep = md.trim() ? 1 : 0;

  return (
    <ToolPage toolId="markdown" activeStep={activeStep}>
      <div className="md-preview">
        <div className="md-preview__editor">
          <label className="md-preview__label" htmlFor="md-input">Your text</label>
          <textarea
            id="md-input"
            className="md-preview__textarea"
            value={md}
            onChange={(e) => setMd(e.target.value)}
            placeholder="Type or paste your text here…"
            spellCheck={false}
          />
        </div>
        <div className="md-preview__output">
          <p className="md-preview__label">Preview</p>
          <div className="md-preview__rendered">
            <SafeMarkdown>{md}</SafeMarkdown>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
