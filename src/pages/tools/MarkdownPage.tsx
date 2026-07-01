import { useState } from "react";
import Markdown from "react-markdown";
import { ToolPage } from "../../components/tools/ToolPage";
import "./MarkdownPage.scss";

const PLACEHOLDER = `# Hello, Markdown!

This is a **live preview**. Type in the left panel and see the result on the right.

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

  return (
    <ToolPage title="Markdown Preview" description="Type or paste markdown on the left, see it rendered live on the right.">
      <div className="md-preview">
        <div className="md-preview__editor">
          <textarea
            className="md-preview__textarea"
            value={md}
            onChange={(e) => setMd(e.target.value)}
            placeholder="Type markdown here..."
            spellCheck={false}
          />
        </div>
        <div className="md-preview__output">
          <div className="md-preview__rendered">
            <Markdown>{md}</Markdown>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
