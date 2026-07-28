import { describe, it, expect } from "vitest";
import { yamlToJson, jsonToYaml } from "./yamlJson";

describe("yamlJson", () => {
  it("converts yaml to json", () => {
    const result = yamlToJson("name: Whisk\nfree: true");
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.output!)).toEqual({ name: "Whisk", free: true });
  });

  it("converts json to yaml", () => {
    const result = jsonToYaml('{"name":"Whisk","free":true}');
    expect(result.ok).toBe(true);
    expect(result.output).toContain("name: Whisk");
  });

  it("rejects invalid yaml", () => {
    expect(yamlToJson("{{not yaml").ok).toBe(false);
  });
});
