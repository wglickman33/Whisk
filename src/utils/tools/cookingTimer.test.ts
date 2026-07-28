import { describe, it, expect } from "vitest";
import { parseTimerInput, formatTimerDisplay } from "./cookingTimer";

describe("cookingTimer", () => {
  it("parses minutes and seconds", () => {
    expect(parseTimerInput(5, 30)).toBe(330);
    expect(parseTimerInput(0, 45)).toBe(45);
  });

  it("rejects invalid input", () => {
    expect(parseTimerInput(0, 0)).toBeNull();
    expect(parseTimerInput(5, 60)).toBeNull();
  });

  it("formats display", () => {
    expect(formatTimerDisplay(90)).toBe("1:30");
    expect(formatTimerDisplay(3661)).toBe("1:01:01");
  });
});
