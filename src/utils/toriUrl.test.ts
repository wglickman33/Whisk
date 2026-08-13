import { afterEach, describe, expect, it, vi } from "vitest";
import { getToriUrl } from "./toriUrl";

describe("getToriUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses VITE_TORI_URL when set", () => {
    vi.stubEnv("VITE_TORI_URL", "https://example.com/tori");
    expect(getToriUrl()).toBe("https://example.com/tori");
  });

  it("falls back to torihome when unset", () => {
    vi.stubEnv("VITE_TORI_URL", "");
    expect(getToriUrl()).toBe("https://torihome.netlify.app");
  });
});
