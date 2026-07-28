import { describe, it, expect } from "vitest";
import {
  fahrenheitToCelsius,
  celsiusToFahrenheit,
  convertOvenTemp,
  celsiusToGasMark,
} from "./ovenTemp";

describe("ovenTemp", () => {
  it("converts fahrenheit to celsius", () => {
    expect(Math.round(fahrenheitToCelsius(350))).toBe(177);
  });

  it("converts celsius to fahrenheit", () => {
    expect(Math.round(celsiusToFahrenheit(180))).toBe(356);
  });

  it("returns full reading", () => {
    const reading = convertOvenTemp(350, "F");
    expect(reading).not.toBeNull();
    expect(reading!.fahrenheit).toBe(350);
    expect(reading!.celsius).toBeGreaterThan(170);
  });

  it("maps gas marks near standard temps", () => {
    expect(celsiusToGasMark(180)).toBe("4");
    expect(celsiusToGasMark(200)).toBe("6");
  });
});
