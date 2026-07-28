import { clampByte } from "./imageAdjust";

export type FilterPreset = "grayscale" | "sepia";

export function applyFilter(imageData: ImageData, preset: FilterPreset): ImageData {
  const output = new ImageData(imageData.width, imageData.height);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    if (preset === "grayscale") {
      const gray = clampByte(0.299 * r + 0.587 * g + 0.114 * b);
      output.data[i] = gray;
      output.data[i + 1] = gray;
      output.data[i + 2] = gray;
    } else {
      output.data[i] = clampByte(r * 0.393 + g * 0.769 + b * 0.189);
      output.data[i + 1] = clampByte(r * 0.349 + g * 0.686 + b * 0.168);
      output.data[i + 2] = clampByte(r * 0.272 + g * 0.534 + b * 0.131);
    }
    output.data[i + 3] = a;
  }

  return output;
}
