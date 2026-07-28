export interface PanSize {
  id: string;
  label: string;
  /** Area in square inches */
  area: number;
}

function roundArea(w: number, h: number): number {
  return Math.round(w * h * 100) / 100;
}

function roundDiameter(d: number): number {
  const r = d / 2;
  return Math.round(Math.PI * r * r * 100) / 100;
}

export const COMMON_PANS: PanSize[] = [
  { id: "8-round", label: '8" round', area: roundDiameter(8) },
  { id: "9-round", label: '9" round', area: roundDiameter(9) },
  { id: "10-round", label: '10" round', area: roundDiameter(10) },
  { id: "8-square", label: '8" square', area: roundArea(8, 8) },
  { id: "9-square", label: '9" square', area: roundArea(9, 9) },
  { id: "8x8", label: '8×8"', area: roundArea(8, 8) },
  { id: "9x13", label: '9×13"', area: roundArea(9, 13) },
  { id: "10x15", label: '10×15"', area: roundArea(10, 15) },
  { id: "9x5-loaf", label: '9×5" loaf', area: roundArea(9, 5) },
  { id: "8x4-loaf", label: '8×4" loaf', area: roundArea(8, 4) },
];

export function getPanById(id: string): PanSize | undefined {
  return COMMON_PANS.find((p) => p.id === id);
}

export function panAreaFromDimensions(width: number, height: number): number | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return roundArea(width, height);
}

export function panAreaFromDiameter(diameter: number): number | null {
  if (!Number.isFinite(diameter) || diameter <= 0) return null;
  return roundDiameter(diameter);
}

export function areaScaleFactor(fromArea: number, toArea: number): number | null {
  if (fromArea <= 0 || toArea <= 0) return null;
  return Math.round((toArea / fromArea) * 1000) / 1000;
}

export interface PanYieldResult {
  ok: boolean;
  factor?: number;
  percentChange?: number;
  timeFactor?: number;
  summary?: string;
  error?: string;
}

export function calculatePanYield(fromArea: number, toArea: number): PanYieldResult {
  const factor = areaScaleFactor(fromArea, toArea);
  if (factor === null) return { ok: false, error: "Pan sizes must be greater than zero." };

  const percentChange = Math.round((factor - 1) * 100);
  const timeFactor = Math.round(Math.cbrt(factor) * 100) / 100;

  const direction =
    factor > 1
      ? `Use ${factor}× the ingredients (about ${percentChange}% more).`
      : factor < 1
        ? `Use ${factor}× the ingredients (about ${Math.abs(percentChange)}% less).`
        : "Same size — no ingredient change needed.";

  const timeNote =
    factor === 1
      ? "Baking time stays about the same."
      : `Adjust baking time to roughly ${timeFactor}× (thicker bakes longer; thinner bakes faster).`;

  return {
    ok: true,
    factor,
    percentChange,
    timeFactor,
    summary: `${direction}\n${timeNote}`,
  };
}

export function panYieldFromIds(fromId: string, toId: string): PanYieldResult {
  const from = getPanById(fromId);
  const to = getPanById(toId);
  if (!from || !to) return { ok: false, error: "Pick valid pans." };
  return calculatePanYield(from.area, to.area);
}
