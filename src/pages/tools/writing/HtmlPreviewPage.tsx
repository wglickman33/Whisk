import { useState, useMemo } from "react";
import { ToolPage } from "../../../components/tools/ToolPage";
import { sanitizeHtmlPreview } from "../../../utils/tools/htmlPreview";
import "./HtmlPreviewPage.scss";

const PLACEHOLDER = `<!DOCTYPE html>
<h1>Hello!</h1>
<p>This is a <strong>live HTML preview</strong>. Unsafe scripts are removed automatically.</p>
<ul>
  <li>Headings, lists, and links work</li>
  <li>Scripts and event handlers are stripped</li>
</ul>
<a href="https://example.com">Example link</a>`;

export function HtmlPreviewPage() {
  const [html, setHtml] = useState(PLACEHOLDER);

  const result = useMemo(() => sanitizeHtmlPreview(html), [html]);
  const activeStep = result.ok ? 2 : html.trim() ? 1 : 0;

  return (
    <ToolPage toolId="html-preview" activeStep={activeStep}>
      <div className="html-preview">
        <div className="html-preview__editor">
          <label className="html-preview__label" htmlFor="html-input">
            Your HTML
          </label>
          <textarea
            id="html-input"
            className="html-preview__textarea"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="Paste HTML here…"
            spellCheck={false}
          />
        </div>
        <div className="html-preview__output">
          <p className="html-preview__label">Preview</p>
          {result.stripped && (
            <p className="html-preview__notice" role="status">
              Unsafe content was removed for your safety.
            </p>
          )}
          <div className="html-preview__rendered">
            {result.ok ? (
              <div dangerouslySetInnerHTML={{ __html: result.html! }} />
            ) : (
              <p className="html-preview__error">{result.error}</p>
            )}
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
