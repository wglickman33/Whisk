import { RECIPE_PHOTO_MAX_COUNT } from "../../utils/recipeImage";
import "./RecipePhotoStaging.scss";

export type StagedRecipePhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type Props = {
  photos: StagedRecipePhoto[];
  importing: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  onRead: () => void;
};

export function RecipePhotoStaging({
  photos,
  importing,
  onMove,
  onRemove,
  onAdd,
  onCancel,
  onRead,
}: Props) {
  const canAdd = photos.length < RECIPE_PHOTO_MAX_COUNT && !importing;

  return (
    <section className="recipe-photo-stage" aria-label="Recipe photos to import">
      <p className="recipe-photo-stage__hint">
        Put pages in order, first to last. Up to {RECIPE_PHOTO_MAX_COUNT} photos.
      </p>
      <ul className="recipe-photo-stage__pages">
        {photos.map((photo, index) => (
          <li key={photo.id} className="recipe-photo-stage__page">
            <div className="recipe-photo-stage__frame">
              <img src={photo.previewUrl} alt="" className="recipe-photo-stage__thumb" />
              <span className="recipe-photo-stage__badge">Page {index + 1}</span>
            </div>
            <div className="recipe-photo-stage__controls">
              <button
                type="button"
                className="recipe-photo-stage__move"
                onClick={() => onMove(index, index - 1)}
                disabled={importing || index === 0}
                aria-label={`Move page ${index + 1} earlier`}
              >
                ‹
              </button>
              <button
                type="button"
                className="recipe-photo-stage__move"
                onClick={() => onMove(index, index + 1)}
                disabled={importing || index === photos.length - 1}
                aria-label={`Move page ${index + 1} later`}
              >
                ›
              </button>
              <button
                type="button"
                className="recipe-photo-stage__remove"
                onClick={() => onRemove(photo.id)}
                disabled={importing}
                aria-label={`Remove page ${index + 1}`}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="recipe-photo-stage__actions">
        <button type="button" className="recipe-photo-stage__secondary" onClick={onAdd} disabled={!canAdd}>
          Add page
        </button>
        <button
          type="button"
          className="recipe-photo-stage__secondary"
          onClick={onCancel}
          disabled={importing}
        >
          Cancel
        </button>
        <button
          type="button"
          className="recipe-photo-stage__primary"
          onClick={onRead}
          disabled={importing || photos.length === 0}
        >
          {importing ? "Reading photos…" : "Read recipe"}
        </button>
      </div>
    </section>
  );
}
