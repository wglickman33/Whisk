import { describe, it, expect } from "vitest";
import {
  searchTools,
  getToolById,
  getRelatedTools,
  getToolsByCategory,
  getPopularTools,
  getCategoriesWithTools,
  getLiveTools,
  TOOLS,
} from "./tools";

describe("tools registry", () => {
  it("finds tool by id", () => {
    expect(getToolById("crop")?.label).toBe("Crop a Photo");
  });

  it("returns popular tools", () => {
    const popular = getPopularTools();
    expect(popular.length).toBeGreaterThan(0);
    expect(popular.every((t) => t.popular)).toBe(true);
  });

  it("groups photo tools", () => {
    const photos = getToolsByCategory("photos");
    expect(photos.length).toBe(13);
    expect(photos.every((t) => t.category === "photos")).toBe(true);
  });

  it("returns related tools in same category", () => {
    const related = getRelatedTools("crop");
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((t) => t.category === "photos" && t.id !== "crop")).toBe(true);
  });

  it("searches by keyword", () => {
    expect(searchTools("smaller").some((t) => t.id === "compress")).toBe(true);
    expect(searchTools("qr").some((t) => t.id === "qr")).toBe(true);
  });

  it("returns all live tools for empty search", () => {
    expect(searchTools("").length).toBe(31);
  });

  it("lists data category tools", () => {
    const cats = getCategoriesWithTools();
    expect(cats).toContain("data");
    expect(getToolsByCategory("data").length).toBe(7);
  });

  it("lists writing category tools", () => {
    const cats = getCategoriesWithTools();
    expect(cats).toContain("writing");
    expect(getToolsByCategory("writing").length).toBe(5);
  });

  it("lists codes category tools", () => {
    expect(getToolsByCategory("codes").length).toBe(2);
  });

  it("lists kitchen category tools", () => {
    const cats = getCategoriesWithTools();
    expect(cats).toContain("kitchen");
    expect(getToolsByCategory("kitchen").length).toBe(4);
  });

  it("lists categories that have tools", () => {
    const cats = getCategoriesWithTools();
    expect(cats).toContain("photos");
    expect(cats).toContain("codes");
    expect(cats).toContain("data");
    expect(cats).toContain("writing");
    expect(cats).toContain("kitchen");
  });

  it("has unique routes and ids for every live tool", () => {
    const live = getLiveTools();
    const ids = live.map((t) => t.id);
    const routes = live.map((t) => t.route);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("live tool count matches category totals", () => {
    expect(getLiveTools().length).toBe(31);
    expect(
      getToolsByCategory("photos").length +
        getToolsByCategory("kitchen").length +
        getToolsByCategory("writing").length +
        getToolsByCategory("codes").length +
        getToolsByCategory("data").length
    ).toBe(31);
  });

  it("every live tool has steps and an icon", () => {
    for (const tool of getLiveTools()) {
      expect(tool.steps.length).toBeGreaterThanOrEqual(2);
      expect(tool.icon).toBeTruthy();
    }
  });

  it("registry matches live filter", () => {
    expect(getLiveTools().length).toBe(TOOLS.filter((t) => t.status === "live").length);
  });
});
