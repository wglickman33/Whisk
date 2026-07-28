export interface PaletteColor {
  hex: string;
  count: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
}

function quantize(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function extractPalette(
  imageData: ImageData,
  maxColors = 8,
  sampleStep = 4
): PaletteColor[] {
  const counts = new Map<string, number>();
  const { width, height, data } = imageData;

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 128) continue;
      const r = quantize(data[i], 32);
      const g = quantize(data[i + 1], 32);
      const b = quantize(data[i + 2], 32);
      const hex = rgbToHex(r, g, b);
      counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([hex, count]) => ({ hex, count }));
}
