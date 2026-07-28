import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isEmailJsConfigured } from "./emailjs.js";

describe("isEmailJsConfigured", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("returns false when any required var is missing", () => {
    delete process.env.EMAILJS_SERVICE_ID;
    delete process.env.EMAILJS_TEMPLATE_ID;
    delete process.env.EMAILJS_PUBLIC_KEY;
    delete process.env.EMAILJS_PRIVATE_KEY;
    expect(isEmailJsConfigured()).toBe(false);
  });

  it("returns true when all vars are set", () => {
    process.env.EMAILJS_SERVICE_ID = "service_x";
    process.env.EMAILJS_TEMPLATE_ID = "template_x";
    process.env.EMAILJS_PUBLIC_KEY = "public_x";
    process.env.EMAILJS_PRIVATE_KEY = "private_x";
    expect(isEmailJsConfigured()).toBe(true);
  });
});
