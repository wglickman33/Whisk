/** Unit conversion — canonical unit per category. Add new units via two map entries. */

/** Volume — canonical: ml */
const VOLUME_TO_ML: Record<string, number> = {
  ml: 1, cl: 10, dl: 100, l: 1000,
  tsp: 4.929, tbsp: 14.787, "fl oz": 29.574, cup: 236.588,
  pint: 473.176, quart: 946.353, gallon: 3785.41,
};

/** Weight — canonical: g */
const WEIGHT_TO_G: Record<string, number> = {
  mg: 0.001, g: 1, kg: 1000,
  oz: 28.35, lb: 453.6, ton: 907185,
};

/** Length — canonical: m */
const LENGTH_TO_M: Record<string, number> = {
  mm: 0.001, cm: 0.01, m: 1, km: 1000,
  in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.34, nm: 1852,
};

/** Area — canonical: m² */
const AREA_TO_M2: Record<string, number> = {
  "mm²": 1e-6, "cm²": 1e-4, "m²": 1, "km²": 1e6,
  "in²": 0.00064516, "ft²": 0.092903, "yd²": 0.836127, "acres": 4046.86, "hectares": 10000,
};

/** Time — canonical: s */
const TIME_TO_S: Record<string, number> = {
  s: 1, min: 60, h: 3600, d: 86400, week: 604800,
};

/** Speed — canonical: m/s */
const SPEED_TO_MS: Record<string, number> = {
  "m/s": 1, "km/h": 0.277778, "mph": 0.44704, "knots": 0.514444, "ft/s": 0.3048,
};

/** Pressure — canonical: Pa */
const PRESSURE_TO_PA: Record<string, number> = {
  Pa: 1, kPa: 1000, bar: 100000, psi: 6894.76, atm: 101325,
};

/** Energy — canonical: J */
const ENERGY_TO_J: Record<string, number> = {
  J: 1, kJ: 1000, "cal": 4.184, kcal: 4184, "kWh": 3600000,
};

/** Data — canonical: bytes */
const DATA_TO_B: Record<string, number> = {
  B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4,
};

export const VOLUME_UNITS = Object.keys(VOLUME_TO_ML) as readonly string[];
export const WEIGHT_UNITS = Object.keys(WEIGHT_TO_G) as readonly string[];
export const LENGTH_UNITS = Object.keys(LENGTH_TO_M) as readonly string[];
export const AREA_UNITS = Object.keys(AREA_TO_M2) as readonly string[];
export const TIME_UNITS = Object.keys(TIME_TO_S) as readonly string[];
export const SPEED_UNITS = Object.keys(SPEED_TO_MS) as readonly string[];
export const PRESSURE_UNITS = Object.keys(PRESSURE_TO_PA) as readonly string[];
export const ENERGY_UNITS = Object.keys(ENERGY_TO_J) as readonly string[];
export const DATA_UNITS = Object.keys(DATA_TO_B) as readonly string[];
export const TEMP_UNITS = ["°F", "°C", "K"] as const;

export type UnitCategory =
  | "volume" | "weight" | "length" | "area" | "time"
  | "speed" | "pressure" | "energy" | "data" | "temp";

const CONVERSION_MAPS: Record<Exclude<UnitCategory, "temp">, Record<string, number>> = {
  volume: VOLUME_TO_ML,
  weight: WEIGHT_TO_G,
  length: LENGTH_TO_M,
  area: AREA_TO_M2,
  time: TIME_TO_S,
  speed: SPEED_TO_MS,
  pressure: PRESSURE_TO_PA,
  energy: ENERGY_TO_J,
  data: DATA_TO_B,
};

export const CATEGORY_LABELS: Record<UnitCategory, string> = {
  volume: "Volume",
  weight: "Weight",
  length: "Length",
  area: "Area",
  time: "Time",
  speed: "Speed",
  pressure: "Pressure",
  energy: "Energy",
  data: "Data",
  temp: "Temperature",
};

function convertLinear(
  value: number,
  from: string,
  to: string,
  map: Record<string, number>
): number {
  const canonical = value * (map[from] ?? 1);
  return canonical / (map[to] ?? 1);
}

function convertTemp(value: number, from: string, to: string): number {
  if (from === to) return value;
  let k: number;
  if (from === "K") k = value;
  else if (from === "°C") k = value + 273.15;
  else k = (value - 32) * (5 / 9) + 273.15;
  if (to === "K") return k;
  if (to === "°C") return k - 273.15;
  return (k - 273.15) * (9 / 5) + 32;
}

export function convert(
  value: number,
  category: UnitCategory,
  fromUnit: string,
  toUnit: string
): number {
  if (category === "temp") return convertTemp(value, fromUnit, toUnit);
  const map = CONVERSION_MAPS[category];
  return convertLinear(value, fromUnit, toUnit, map);
}

export function getUnitsForCategory(category: UnitCategory): readonly string[] {
  switch (category) {
    case "volume": return VOLUME_UNITS;
    case "weight": return WEIGHT_UNITS;
    case "length": return LENGTH_UNITS;
    case "area": return AREA_UNITS;
    case "time": return TIME_UNITS;
    case "speed": return SPEED_UNITS;
    case "pressure": return PRESSURE_UNITS;
    case "energy": return ENERGY_UNITS;
    case "data": return DATA_UNITS;
    case "temp": return [...TEMP_UNITS];
    default: return [];
  }
}

const DEFAULTS: Record<UnitCategory, { from: string; to: string }> = {
  volume: { from: "cup", to: "ml" },
  weight: { from: "oz", to: "g" },
  length: { from: "ft", to: "m" },
  area: { from: "ft²", to: "m²" },
  time: { from: "h", to: "min" },
  speed: { from: "mph", to: "km/h" },
  pressure: { from: "psi", to: "bar" },
  energy: { from: "kcal", to: "kJ" },
  data: { from: "MB", to: "GB" },
  temp: { from: "°F", to: "°C" },
};

export function getDefaultFromUnit(category: UnitCategory): string {
  return DEFAULTS[category].from;
}

export function getDefaultToUnit(category: UnitCategory): string {
  return DEFAULTS[category].to;
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  "volume", "weight", "length", "area", "time",
  "speed", "pressure", "energy", "data", "temp",
];
