import type { UnitCategory } from "./unitUtils";

export type QuickPick = {
  label: string;
  from: string;
  to: string;
  value?: string;
};

export const QUICK_PICKS: Record<UnitCategory, QuickPick[]> = {
  volume: [
    { label: "1 cup → ml", from: "cup", to: "ml", value: "1" },
    { label: "1 tbsp → tsp", from: "tbsp", to: "tsp", value: "1" },
    { label: "1 fl oz → ml", from: "fl oz", to: "ml", value: "1" },
    { label: "1 pint → cup", from: "pint", to: "cup", value: "1" },
  ],
  weight: [
    { label: "1 oz → g", from: "oz", to: "g", value: "1" },
    { label: "1 lb → kg", from: "lb", to: "kg", value: "1" },
    { label: "100 g → oz", from: "g", to: "oz", value: "100" },
  ],
  length: [
    { label: "1 ft → m", from: "ft", to: "m", value: "1" },
    { label: "1 in → cm", from: "in", to: "cm", value: "1" },
    { label: "1 mi → km", from: "mi", to: "km", value: "1" },
  ],
  area: [
    { label: "1 ft² → m²", from: "ft²", to: "m²", value: "1" },
    { label: "1 acre → ha", from: "acres", to: "hectares", value: "1" },
  ],
  time: [
    { label: "1 h → min", from: "h", to: "min", value: "1" },
    { label: "1 d → h", from: "d", to: "h", value: "1" },
  ],
  speed: [
    { label: "60 mph → km/h", from: "mph", to: "km/h", value: "60" },
    { label: "1 m/s → mph", from: "m/s", to: "mph", value: "1" },
  ],
  pressure: [
    { label: "1 psi → bar", from: "psi", to: "bar", value: "1" },
    { label: "1 atm → psi", from: "atm", to: "psi", value: "1" },
  ],
  energy: [
    { label: "1 kcal → kJ", from: "kcal", to: "kJ", value: "1" },
    { label: "1 kWh → kJ", from: "kWh", to: "kJ", value: "1" },
  ],
  data: [
    { label: "1 MB → GB", from: "MB", to: "GB", value: "1" },
    { label: "1 GB → TB", from: "GB", to: "TB", value: "1" },
  ],
  temp: [
    { label: "32 °F → °C", from: "°F", to: "°C", value: "32" },
    { label: "100 °C → °F", from: "°C", to: "°F", value: "100" },
    { label: "0 °C → K", from: "°C", to: "K", value: "0" },
  ],
};
