import {
  checkImageDimensions,
  exportCanvasToBlob,
  getOutputMimeType,
} from "../canvasUtils";

export type RotateAction = "rotate-90" | "rotate-180" | "rotate-270" | "flip-h" | "flip-v";

export function rotateImage(
  src: string,
  action: RotateAction,
  mimeType: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const swap = action === "rotate-90" || action === "rotate-270";
      const outW = swap ? h : w;
      const outH = swap ? w : h;

      const check = checkImageDimensions(outW, outH);
      if (!check.ok) {
        reject(new Error(check.error));
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not prepare your photo. Try a different file."));
        return;
      }

      switch (action) {
        case "rotate-90":
          ctx.translate(outW, 0);
          ctx.rotate(Math.PI / 2);
          break;
        case "rotate-180":
          ctx.translate(outW, outH);
          ctx.rotate(Math.PI);
          break;
        case "rotate-270":
          ctx.translate(0, outH);
          ctx.rotate(-Math.PI / 2);
          break;
        case "flip-h":
          ctx.translate(outW, 0);
          ctx.scale(-1, 1);
          break;
        case "flip-v":
          ctx.translate(0, outH);
          ctx.scale(1, -1);
          break;
      }

      ctx.drawImage(img, 0, 0);

      try {
        resolve(await exportCanvasToBlob(canvas, mimeType));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Could not load this photo. Try a different file."));
    img.src = src;
  });
}

export function getOutputMimeFromFile(fileType: string): string {
  return getOutputMimeType(fileType);
}
