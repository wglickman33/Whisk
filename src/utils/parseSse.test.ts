import { describe, it, expect } from "vitest";
import { parseSseBuffer } from "./parseSse";

describe("parseSseBuffer", () => {
  it("parses complete events and keeps a partial frame", () => {
    const { events, rest } = parseSseBuffer(
      'event: tool.start\ndata: {"name":"search_recipes"}\n\nevent: reply\ndata: {"reply":"Hi'
    );
    expect(events).toEqual([
      { event: "tool.start", data: '{"name":"search_recipes"}' },
    ]);
    expect(rest).toBe('event: reply\ndata: {"reply":"Hi');
  });

  it("ignores comment pings", () => {
    expect(parseSseBuffer(": ping\n\n").events).toEqual([]);
  });
});
