export interface WatermarkOptions {
  text: string;
  opacity: number;
  size: number;
  position: "bottom-right" | "bottom-left" | "center";
}

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: WatermarkOptions
): void {
  const text = options.text.trim();
  if (!text) return;

  const fontSize = Math.max(12, Math.round((options.size / 100) * Math.min(width, height) * 0.08));
  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0.1, options.opacity / 100));
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = Math.max(2, fontSize * 0.08);

  const padding = fontSize * 0.75;
  const metrics = ctx.measureText(text);
  let x = padding;
  let y = height - padding;

  if (options.position === "bottom-right") {
    x = width - metrics.width - padding;
    y = height - padding;
  } else if (options.position === "center") {
    x = (width - metrics.width) / 2;
    y = height / 2;
  }

  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}
