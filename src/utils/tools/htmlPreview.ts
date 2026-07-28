import DOMPurify from "isomorphic-dompurify";

const MAX_HTML_LENGTH = 200_000;

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr", "ul", "ol", "li",
  "a", "strong", "em", "b", "i", "u", "s", "del",
  "code", "pre", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td",
  "img", "div", "span", "section", "article",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "class", "id", "target", "rel", "width", "height"];

const PURIFY_OPTIONS = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
};

export interface HtmlPreviewResult {
  ok: boolean;
  html?: string;
  error?: string;
  stripped?: boolean;
}

export function sanitizeHtmlPreview(raw: string): HtmlPreviewResult {
  const input = raw.trim();
  if (!input) return { ok: false, error: "Paste some HTML first." };
  if (input.length > MAX_HTML_LENGTH) {
    return { ok: false, error: `HTML is too long (max ${MAX_HTML_LENGTH.toLocaleString()} characters).` };
  }

  const sanitized = DOMPurify.sanitize(input, PURIFY_OPTIONS);

  return {
    ok: true,
    html: sanitized,
    stripped: sanitized.length !== input.length || /<script|onerror=|javascript:/i.test(input),
  };
}

export function wrapHtmlDocument(bodyHtml: string, title = "Preview"): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${bodyHtml}</body></html>`;
}
