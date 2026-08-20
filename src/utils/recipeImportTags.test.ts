import { describe, it, expect } from "vitest";
import { matchRecipeImportTags } from "./recipeImportTags";

const tags = [
  { id: "1", label: "Savory" },
  { id: "2", label: "Fish" },
  { id: "3", label: "Spicy" },
];

describe("matchRecipeImportTags", () => {
  it("selects existing tags and keeps new labels for later", () => {
    expect(matchRecipeImportTags(tags, ["savory", "Chicken", "Fish", "chicken"])).toEqual({
      matchedIds: ["1", "2"],
      pendingLabels: ["Chicken"],
    });
  });

  it("handles missing labels", () => {
    expect(matchRecipeImportTags(tags, undefined)).toEqual({ matchedIds: [], pendingLabels: [] });
  });
});
