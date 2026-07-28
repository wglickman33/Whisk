import { describe, it, expect } from "vitest";
import { fromUnix, toUnix, formatTimestampInfo } from "./timestamp";

describe("timestamp", () => {
  it("converts unix seconds to date", () => {
    const result = fromUnix("0");
    expect(result.ok).toBe(true);
    expect(result.output).toBeTruthy();
  });

  it("converts date to unix", () => {
    const result = toUnix("1970-01-01T00:00:00.000Z");
    expect(result.ok).toBe(true);
    expect(result.output).toContain("Seconds: 0");
  });

  it("formats timestamp info", () => {
    const info = formatTimestampInfo(new Date("2026-01-01T00:00:00.000Z"));
    expect(info.unixSeconds).toBe(Math.floor(Date.parse("2026-01-01T00:00:00.000Z") / 1000));
    expect(info.iso).toContain("2026-01-01");
  });
});
