import { describe, it, expect } from "vitest";
import { generateUuids } from "./uuid";

describe("generateUuids", () => {
  it("generates requested count", () => {
    expect(generateUuids(5)).toHaveLength(5);
  });

  it("caps at 100", () => {
    expect(generateUuids(500)).toHaveLength(100);
  });

  it("generates unique values", () => {
    const ids = generateUuids(20);
    expect(new Set(ids).size).toBe(20);
  });
});
