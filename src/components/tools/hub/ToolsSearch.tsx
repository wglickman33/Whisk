import { useId } from "react";
import "./ToolsSearch.scss";

type Props = {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
};

export function ToolsSearch({ value, onChange, resultCount }: Props) {
  const id = useId();
  const liveId = `${id}-live`;

  return (
    <div className="tools-search">
      <label className="tools-search__label" htmlFor={id}>
        Search tools
      </label>
      <div className="tools-search__field">
        <svg className="tools-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          id={id}
          type="search"
          className="tools-search__input"
          placeholder="Try “smaller photo” or “qr code”…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={resultCount !== undefined ? liveId : undefined}
          autoComplete="off"
        />
      </div>
      {resultCount !== undefined && (
        <p id={liveId} className="tools-search__count" aria-live="polite">
          {resultCount === 0
            ? "No tools match your search."
            : `${resultCount} tool${resultCount === 1 ? "" : "s"} found`}
        </p>
      )}
    </div>
  );
}
