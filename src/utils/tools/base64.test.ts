import { describe, it, expect } from "vitest";
import { encodeTextToBase64, decodeBase64ToText } from "./base64";

describe("base64 text", () => {
  it("round-trips utf-8 text", () => {
    const original = "Hello, 世界";
    const encoded = encodeTextToBase64(original);
    expect(encoded.ok).toBe(true);
    const decoded = decodeBase64ToText(encoded.output!);
    expect(decoded.output).toBe(original);
  });

  it("rejects invalid base64", () => {
    expect(decodeBase64ToText("not!!!base64").ok).toBe(false);
  });
});
