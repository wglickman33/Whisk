import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getPopularTools,
  getToolsByCategory,
  searchTools,
  TOOL_CATEGORY_LABELS,
  getCategoriesWithTools,
  TOOL_CATEGORY_ORDER,
  type ToolCategory,
} from "../../constants/tools";
import { ToolsSearch } from "../../components/tools/hub/ToolsSearch";
import { ToolCard } from "../../components/tools/hub/ToolCard";
import "./ToolsHomePage.scss";

export function ToolsHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") as ToolCategory | null;
  const [query, setQuery] = useState("");

  const isSearching = query.trim().length > 0;
  const searchResults = useMemo(() => searchTools(query), [query]);
  const popular = getPopularTools();
  const categories = getCategoriesWithTools();

  const filteredCategory =
    categoryParam && categories.includes(categoryParam) ? categoryParam : null;

  const setCategory = (cat: ToolCategory | null) => {
    if (cat) setSearchParams({ category: cat });
    else setSearchParams({});
    setQuery("");
  };

  return (
    <div className="tools-home">
      <header className="tools-home__header">
        <h1 className="tools-home__title">Tools</h1>
        <p className="tools-home__intro">
          Free helpers for photos, recipes, and everyday tasks. No account needed.
        </p>
      </header>

      <ToolsSearch
        value={query}
        onChange={(v) => {
          setQuery(v);
          if (v.trim()) setSearchParams({});
        }}
        resultCount={isSearching ? searchResults.length : undefined}
      />

      {!isSearching && (
        <div className="tools-home__filters" role="group" aria-label="Filter by category">
          <button
            type="button"
            className={`tools-home__chip ${!filteredCategory ? "tools-home__chip--active" : ""}`}
            onClick={() => setCategory(null)}
          >
            All tools
          </button>
          {TOOL_CATEGORY_ORDER.filter((c) => categories.includes(c)).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`tools-home__chip ${filteredCategory === cat ? "tools-home__chip--active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {TOOL_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {!isSearching && !filteredCategory && (
        <section className="tools-home__section" aria-labelledby="popular-heading">
          <h2 id="popular-heading" className="tools-home__section-title">
            Popular
          </h2>
          <div className="tools-home__grid tools-home__grid--popular">
            {popular.map((tool) => (
              <ToolCard key={tool.id} tool={tool} variant="popular" />
            ))}
          </div>
        </section>
      )}

      {isSearching && (
        <section className="tools-home__section" aria-labelledby="search-heading">
          <h2 id="search-heading" className="tools-home__section-title">
            Search results
          </h2>
          {searchResults.length > 0 ? (
            <div className="tools-home__grid">
              {searchResults.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <p className="tools-home__empty">Try words like “crop”, “smaller photo”, or “qr code”.</p>
          )}
        </section>
      )}

      {!isSearching &&
        (filteredCategory ? [filteredCategory] : categories).map((cat) => {
          const tools = getToolsByCategory(cat);
          if (tools.length === 0) return null;
          return (
            <section key={cat} className="tools-home__section" aria-labelledby={`cat-${cat}`}>
              <h2 id={`cat-${cat}`} className="tools-home__section-title">
                {TOOL_CATEGORY_LABELS[cat]}
              </h2>
              <div className="tools-home__grid">
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}
