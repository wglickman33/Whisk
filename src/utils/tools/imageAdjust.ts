export interface AdjustSettings {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
}

export function clampByte(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function applyAdjustments(imageData: ImageData, settings: AdjustSettings): ImageData {
  const output = new ImageData(imageData.width, imageData.height);
  const brightness = settings.brightness * 2.55;
  const contrast = (settings.contrast + 100) / 100;
  const saturation = (settings.saturation + 100) / 100;

  for (let i = 0; i < imageData.data.length; i += 4) {
    let r = imageData.data[i];
    let g = imageData.data[i + 1];
    let b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    r = clampByte((r - 128) * contrast + 128 + brightness);
    g = clampByte((g - 128) * contrast + 128 + brightness);
    b = clampByte((b - 128) * contrast + 128 + brightness);

    if (saturation !== 1) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = clampByte(gray + (r - gray) * saturation);
      g = clampByte(gray + (g - gray) * saturation);
      b = clampByte(gray + (b - gray) * saturation);
    }

    output.data[i] = r;
    output.data[i + 1] = g;
    output.data[i + 2] = b;
    output.data[i + 3] = a;
  }

  return output;
}
