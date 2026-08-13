export type TempUnit = "F" | "C";

export interface OvenTempReading {
  fahrenheit: number;
  celsius: number;
  gasMark: string;
  fanCelsius: number;
}

const GAS_MARK_TABLE: { mark: string; celsius: number }[] = [
  { mark: "-", celsius: 0 },
  { mark: "¼", celsius: 110 },
  { mark: "½", celsius: 120 },
  { mark: "1", celsius: 140 },
  { mark: "2", celsius: 150 },
  { mark: "3", celsius: 160 },
  { mark: "4", celsius: 180 },
  { mark: "5", celsius: 190 },
  { mark: "6", celsius: 200 },
  { mark: "7", celsius: 220 },
  { mark: "8", celsius: 230 },
  { mark: "9", celsius: 240 },
];

export function fahrenheitToCelsius(f: number): number {
  return (f - 32) * (5 / 9);
}

export function celsiusToFahrenheit(c: number): number {
  return c * (9 / 5) + 32;
}

export function celsiusToGasMark(celsius: number): string {
  if (celsius < 100) return "-";
  let best = GAS_MARK_TABLE[1];
  let bestDiff = Math.abs(celsius - best.celsius);
  for (const entry of GAS_MARK_TABLE.slice(1)) {
    const diff = Math.abs(celsius - entry.celsius);
    if (diff < bestDiff) {
      best = entry;
      bestDiff = diff;
    }
  }
  return bestDiff <= 10 ? best.mark : "-";
}

export function fanAdjustedCelsius(celsius: number): number {
  return Math.round(celsius - 20);
}

export function convertOvenTemp(value: number, from: TempUnit): OvenTempReading | null {
  if (!Number.isFinite(value)) return null;

  const celsius = from === "C" ? value : fahrenheitToCelsius(value);
  const fahrenheit = from === "F" ? value : celsiusToFahrenheit(value);

  if (celsius < -273 || fahrenheit < -459) return null;

  return {
    fahrenheit: Math.round(fahrenheit),
    celsius: Math.round(celsius),
    gasMark: celsiusToGasMark(celsius),
    fanCelsius: fanAdjustedCelsius(celsius),
  };
}

export function formatOvenTempSummary(reading: OvenTempReading): string {
  const gas = reading.gasMark === "-" ? "Gas mark N/A" : `Gas mark ${reading.gasMark}`;
  return [
    `${reading.fahrenheit}°F`,
    `${reading.celsius}°C (conventional)`,
    `${reading.fanCelsius}°C (fan / convection)`,
    gas,
  ].join("\n");
}
