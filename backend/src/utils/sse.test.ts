import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { parseJsonValue, wantsEventStream, writeSse } from "./sse.js";

describe("parseJsonValue", () => {
  it("parses JSON and falls back to the raw string", () => {
    expect(parseJsonValue('{"query":"chicken"}')).toEqual({ query: "chicken" });
    expect(parseJsonValue("not-json")).toBe("not-json");
  });
});

describe("wantsEventStream", () => {
  it("detects the SSE accept header", () => {
    expect(wantsEventStream({ headers: { accept: "text/event-stream" } } as Request)).toBe(true);
    expect(wantsEventStream({ headers: { accept: "application/json" } } as Request)).toBe(false);
  });
});

describe("writeSse", () => {
  it("writes event and data frames", () => {
    const write = vi.fn();
    writeSse({ write } as unknown as Response, "reply", { reply: "Hi" });
    expect(write).toHaveBeenNthCalledWith(1, "event: reply\n");
    expect(write).toHaveBeenNthCalledWith(2, 'data: {"reply":"Hi"}\n\n');
  });
});
