import { describe, it, expect } from "vitest";
import { buildQrPayload, buildWifiPayload } from "./qrFormat";

describe("buildQrPayload", () => {
  it("builds url with https prefix", () => {
    const result = buildQrPayload({ template: "url", text: "example.com" });
    expect(result.ok).toBe(true);
    expect(result.payload).toBe("https://example.com");
  });

  it("builds mailto link", () => {
    const result = buildQrPayload({ template: "email", text: "", email: "hello@example.com" });
    expect(result.payload).toBe("mailto:hello@example.com");
  });

  it("builds tel link", () => {
    const result = buildQrPayload({ template: "phone", text: "", phone: "+1-555-0100" });
    expect(result.payload).toBe("tel:+1-555-0100");
  });

  it("builds wifi payload", () => {
    const result = buildWifiPayload({
      ssid: "HomeNet",
      password: "secret",
      encryption: "WPA",
    });
    expect(result.ok).toBe(true);
    expect(result.payload).toContain("WIFI:T:WPA");
    expect(result.payload).toContain("S:HomeNet");
  });
});
