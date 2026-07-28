export function buildSharpenKernel(strength: number): number[] {
  const s = strength;
  return [0, -s, 0, -s, 1 + 4 * s, -s, 0, -s, 0];
}

export function applyConvolution(
  imageData: ImageData,
  kernel: number[],
  kernelSize: number
): ImageData {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx - half));
          const py = Math.min(height - 1, Math.max(0, y + ky - half));
          const i = (py * width + px) * 4;
          const w = kernel[ky * kernelSize + kx];
          r += data[i] * w;
          g += data[i + 1] * w;
          b += data[i + 2] * w;
        }
      }
      const idx = (y * width + x) * 4;
      output.data[idx] = Math.min(255, Math.max(0, r));
      output.data[idx + 1] = Math.min(255, Math.max(0, g));
      output.data[idx + 2] = Math.min(255, Math.max(0, b));
      output.data[idx + 3] = data[idx + 3];
    }
  }
  return output;
}
