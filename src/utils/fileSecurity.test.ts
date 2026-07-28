import { describe, it, expect } from "vitest";
import {
  validateUploadedFile,
  validateFileContent,
  sanitizeSvgContent,
  FILE_SIZE_LIMITS,
} from "./fileSecurity";

function makeFile(name: string, content: Uint8Array, type = ""): File {
  const copy = new Uint8Array(content);
  return new File([copy], name, { type });
}

describe("validateUploadedFile", () => {
  it("rejects blocked extensions like .exe", () => {
    const file = makeFile("malware.exe", new Uint8Array([1, 2, 3]));
    const result = validateUploadedFile(file, { maxBytes: FILE_SIZE_LIMITS.imageTool });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not allowed/i);
  });

  it("rejects double extension tricks", () => {
    const file = makeFile("photo.png.exe", new Uint8Array([1, 2, 3]));
    const result = validateUploadedFile(file, { maxBytes: FILE_SIZE_LIMITS.imageTool });
    expect(result.ok).toBe(false);
  });

  it("rejects files over size limit", () => {
    const file = makeFile("big.png", new Uint8Array(26 * 1024 * 1024));
    const result = validateUploadedFile(file, { maxBytes: FILE_SIZE_LIMITS.imageTool });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/25 MB/);
  });

  it("rejects empty files", () => {
    const file = makeFile("empty.png", new Uint8Array(0));
    const result = validateUploadedFile(file, { maxBytes: FILE_SIZE_LIMITS.imageTool });
    expect(result.ok).toBe(false);
  });

  it("accepts valid png upload metadata", () => {
    const file = makeFile("photo.png", new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    const result = validateUploadedFile(file, { maxBytes: FILE_SIZE_LIMITS.imageTool });
    expect(result.ok).toBe(true);
  });
});

describe("validateFileContent", () => {
  it("rejects png extension with wrong magic bytes", async () => {
    const file = makeFile("fake.png", new Uint8Array([0x00, 0x00, 0x00, 0x00]));
    const result = await validateFileContent(file, "png");
    expect(result.ok).toBe(false);
  });

  it("accepts valid png magic bytes", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = makeFile("photo.png", bytes);
    const result = await validateFileContent(file, "png");
    expect(result.ok).toBe(true);
  });
});

describe("sanitizeSvgContent", () => {
  it("strips script tags", () => {
    const svg = '<svg><script>alert(1)</script><rect /></svg>';
    expect(sanitizeSvgContent(svg)).not.toContain("<script");
    expect(sanitizeSvgContent(svg)).toContain("<rect");
  });

  it("strips inline event handlers", () => {
    const svg = '<svg><rect onclick="alert(1)" /></svg>';
    expect(sanitizeSvgContent(svg)).not.toMatch(/onclick/i);
  });
});
