import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RecipePhotoStaging, type StagedRecipePhoto } from "./RecipePhotoStaging";

const previewUrl = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

function photo(id: string): StagedRecipePhoto {
  return { id, file: new File([""], `${id}.jpg`, { type: "image/jpeg" }), previewUrl };
}

afterEach(() => {
  cleanup();
});

describe("RecipePhotoStaging", () => {
  it("labels pages and moves them later", () => {
    const onMove = vi.fn();
    render(
      <RecipePhotoStaging
        photos={[photo("a"), photo("b")]}
        importing={false}
        onMove={onMove}
        onRemove={vi.fn()}
        onAdd={vi.fn()}
        onCancel={vi.fn()}
        onRead={vi.fn()}
      />
    );

    expect(screen.getByText("Page 1")).toBeTruthy();
    expect(screen.getByText("Page 2")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Move page 1 later"));
    expect(onMove).toHaveBeenCalledWith(0, 1);
  });

  it("reads the staged photos", () => {
    const onRead = vi.fn();
    render(
      <RecipePhotoStaging
        photos={[photo("a")]}
        importing={false}
        onMove={vi.fn()}
        onRemove={vi.fn()}
        onAdd={vi.fn()}
        onCancel={vi.fn()}
        onRead={onRead}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Read recipe" }));
    expect(onRead).toHaveBeenCalledTimes(1);
  });
});
