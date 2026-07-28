import type { FavoritePair, SavedConversion } from "../../../converters/units/unitStorage";
import type { UnitCategory } from "../../../converters/units/unitUtils";

type Props = {
  recent: SavedConversion[];
  favorites: FavoritePair[];
  onApplyRecent: (entry: SavedConversion) => void;
  onApplyFavorite: (entry: FavoritePair) => void;
  onRemoveFavorite: (id: string) => void;
  onToggleFavorite: () => void;
  isCurrentFavorite: boolean;
  category: UnitCategory;
};

export function UnitConverterHistory({
  recent,
  favorites,
  onApplyRecent,
  onApplyFavorite,
  onRemoveFavorite,
  onToggleFavorite,
  isCurrentFavorite,
  category,
}: Props) {
  const categoryFavorites = favorites.filter((f) => f.category === category);
  const categoryRecent = recent.filter((r) => r.category === category);

  return (
    <div className="uc__history">
      <div className="uc__history-save">
        <button
          type="button"
          className={`uc__save-btn ${isCurrentFavorite ? "uc__save-btn--active" : ""}`}
          onClick={onToggleFavorite}
        >
          <svg viewBox="0 0 24 24" fill={isCurrentFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
          {isCurrentFavorite ? "Saved to favorites" : "Save this unit pair"}
        </button>
      </div>

      {categoryFavorites.length > 0 && (
        <div className="uc__history-group">
          <span className="uc__history-label">Favorites</span>
          <div className="uc__history-chips">
            {categoryFavorites.map((f) => (
              <span key={f.id} className="uc__history-chip-wrap">
                <button
                  type="button"
                  className="uc__chip uc__chip--fav"
                  onClick={() => onApplyFavorite(f)}
                >
                  {f.label}
                </button>
                <button
                  type="button"
                  className="uc__history-remove"
                  onClick={() => onRemoveFavorite(f.id)}
                  aria-label={`Remove ${f.label}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {categoryRecent.length > 0 && (
        <div className="uc__history-group">
          <span className="uc__history-label">Recent</span>
          <div className="uc__history-chips">
            {categoryRecent.map((r) => (
              <button
                key={r.savedAt}
                type="button"
                className="uc__chip uc__chip--recent"
                onClick={() => onApplyRecent(r)}
              >
                {r.input} {r.fromUnit} → {r.toUnit}
              </button>
            ))}
          </div>
        </div>
      )}

      {categoryFavorites.length === 0 && categoryRecent.length === 0 && (
        <p className="uc__history-empty">
          Conversions you use will appear here. Tap the button above to save a unit pair you reach for often.
        </p>
      )}
    </div>
  );
}
