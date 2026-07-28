import { describe, it, expect } from "vitest";
import { assertSafeFetchUrl, resolveRedirectUrl, UrlSafetyError } from "./urlSafety.js";

describe("assertSafeFetchUrl", () => {
  it("allows public https urls", () => {
    const url = assertSafeFetchUrl("https://example.com/recipe");
    expect(url.hostname).toBe("example.com");
  });

  it("blocks localhost and loopback", () => {
    expect(() => assertSafeFetchUrl("http://localhost/recipe")).toThrow(UrlSafetyError);
    expect(() => assertSafeFetchUrl("http://127.0.0.1/internal")).toThrow(UrlSafetyError);
  });

  it("blocks private and link-local ipv4", () => {
    expect(() => assertSafeFetchUrl("http://10.0.0.1/x")).toThrow(UrlSafetyError);
    expect(() => assertSafeFetchUrl("http://192.168.1.1/x")).toThrow(UrlSafetyError);
    expect(() => assertSafeFetchUrl("http://169.254.169.254/meta")).toThrow(UrlSafetyError);
  });

  it("blocks file protocol and credentials", () => {
    expect(() => assertSafeFetchUrl("file:///etc/passwd")).toThrow(UrlSafetyError);
    expect(() => assertSafeFetchUrl("https://user:pass@example.com/x")).toThrow(UrlSafetyError);
  });

  it("blocks invalid urls", () => {
    expect(() => assertSafeFetchUrl("not-a-url")).toThrow(UrlSafetyError);
  });
});

describe("resolveRedirectUrl", () => {
  it("allows redirect to another public https url", () => {
    const base = assertSafeFetchUrl("https://example.com/a");
    const next = resolveRedirectUrl("/b", base);
    expect(next.href).toBe("https://example.com/b");
  });

  it("blocks redirect to internal targets", () => {
    const base = assertSafeFetchUrl("https://example.com/a");
    expect(() => resolveRedirectUrl("http://127.0.0.1/internal", base)).toThrow(UrlSafetyError);
  });
});
