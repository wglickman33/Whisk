import { describe, it, expect } from "vitest";
import { transformCase } from "./textCase";

describe("transformCase", () => {
  it("converts to snake_case", () => {
    expect(transformCase("HelloWorld", "snake")).toBe("hello_world");
  });

  it("converts to camelCase", () => {
    expect(transformCase("hello world", "camel")).toBe("helloWorld");
  });

  it("converts to kebab-case", () => {
    expect(transformCase("Hello World", "kebab")).toBe("hello-world");
  });
});
