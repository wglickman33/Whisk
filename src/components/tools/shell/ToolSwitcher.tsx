import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  getLiveTools,
  getToolById,
  searchTools,
  TOOL_CATEGORY_LABELS,
  TOOL_CATEGORY_ORDER,
  type ToolCategory,
} from "../../../constants/tools";
import "./ToolSwitcher.scss";

type Props = {
  currentToolId: string;
};

export function ToolSwitcher({ currentToolId }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const current = getToolById(currentToolId);

  const results = useMemo(() => searchTools(query), [query]);

  const grouped = useMemo(() => {
    const map = new Map<ToolCategory, ReturnType<typeof getLiveTools>>();
    for (const cat of TOOL_CATEGORY_ORDER) {
      const items = results.filter((t) => t.category === cat);
      if (items.length) map.set(cat, items);
    }
    return map;
  }, [results]);

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="tool-switcher" ref={panelRef}>
      <button
        type="button"
        className="tool-switcher__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        Switch tool
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="tool-switcher__panel" role="dialog" aria-label="Choose a tool">
          <input
            type="search"
            className="tool-switcher__search"
            placeholder="Search tools…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="tool-switcher__list">
            {current && !query && (
              <p className="tool-switcher__section-label">
                {TOOL_CATEGORY_LABELS[current.category]}
              </p>
            )}
            {[...grouped.entries()].map(([cat, tools]) => (
              <div key={cat} className="tool-switcher__group">
                {(query || cat !== current?.category) && (
                  <p className="tool-switcher__section-label">{TOOL_CATEGORY_LABELS[cat]}</p>
                )}
                <ul className="tool-switcher__items">
                  {tools.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        to={tool.route}
                        className={`tool-switcher__item ${tool.id === currentToolId ? "tool-switcher__item--active" : ""}`}
                        onClick={() => setOpen(false)}
                      >
                        <span className="tool-switcher__item-icon" aria-hidden>
                          <tool.icon />
                        </span>
                        <span className="tool-switcher__item-text">
                          <span className="tool-switcher__item-label">{tool.label}</span>
                          <span className="tool-switcher__item-desc">{tool.description}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {results.length === 0 && (
              <p className="tool-switcher__empty">No tools match your search.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
