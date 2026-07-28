import { describe, it, expect } from "vitest";
import { formatExifFields } from "./exifReader";

describe("formatExifFields", () => {
  it("maps known fields to labels", () => {
    const fields = formatExifFields({ Make: "Canon", Model: "EOS", Foo: "bar" });
    expect(fields.some((f) => f.label === "Camera make" && f.value === "Canon")).toBe(true);
    expect(fields.some((f) => f.label === "Camera model")).toBe(true);
    expect(fields.some((f) => f.value === "bar")).toBe(false);
  });
});
