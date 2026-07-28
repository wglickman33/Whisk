import type { ConversionHandler, FileData } from "../core/types";
import { getFFmpeg } from "../utils/ffmpegLoader";
import { swapExtension } from "../utils/fileUtils";
import {
  prepareImageForConversion,
  canConvertImageWithCanvas,
  convertImageWithCanvas,
  convertImageToPdf,
  mimeForImageFormat,
} from "../utils/imageUtils";

const IMAGE_FORMATS = [
  "jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "avif", "ico", "heic", "heif", "svg",
];

const IMAGE_OUTPUTS = [...IMAGE_FORMATS.filter((f) => f !== "jpeg" && f !== "heif"), "pdf"];

class ImageHandler implements ConversionHandler {
  public name = "image";
  public ready = false;
  private ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null;

  async init(): Promise<void> {
    this.ready = true;
  }

  private async ensureFfmpeg(): Promise<void> {
    if (!this.ffmpeg) {
      this.ffmpeg = await getFFmpeg();
    }
  }

  canConvert(from: string, to: string): boolean {
    const f = from.toLowerCase();
    const t = to.toLowerCase();
    if (f === t) return false;
    if (!IMAGE_FORMATS.includes(f)) return false;
    if (t === "pdf") return true;
    return IMAGE_OUTPUTS.includes(t) && t !== "pdf";
  }

  async convert(file: FileData, outputFormat: string): Promise<FileData> {
    const prepared = await prepareImageForConversion(file);

    if (outputFormat === "pdf") {
      return convertImageToPdf(prepared);
    }

    if (canConvertImageWithCanvas(prepared.extension, outputFormat)) {
      return convertImageWithCanvas(prepared, outputFormat);
    }

    await this.ensureFfmpeg();
    if (!this.ffmpeg) throw new Error("ImageHandler not initialized");

    const inputName = `input.${prepared.extension}`;
    const outputName = `output.${outputFormat}`;

    await this.ffmpeg.writeFile(inputName, prepared.buffer);
    await this.ffmpeg.exec(["-i", inputName, outputName]);

    const outputData = await this.ffmpeg.readFile(outputName) as Uint8Array;
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return {
      name: swapExtension(file.name, outputFormat),
      buffer: new Uint8Array(outputData),
      mimeType: mimeForImageFormat(outputFormat),
      extension: outputFormat,
    };
  }
}

export default ImageHandler;
