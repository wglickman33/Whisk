import { describe, it, expect } from "vitest";
import { hashText } from "./hash";

describe("hashText", () => {
  it("hashes sha-256 deterministically", async () => {
    const a = await hashText("hello", "SHA-256");
    const b = await hashText("hello", "SHA-256");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
