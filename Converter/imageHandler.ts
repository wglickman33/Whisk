import type { ConversionHandler, FileData } from "../core/types";
import { getFFmpeg, fetchFile } from "../utils/ffmpegLoader";
import { swapExtension } from "../utils/fileUtils";

const SUPPORTED_IMAGE_FORMATS = [
  "jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "avif", "ico",
];

class ImageHandler implements ConversionHandler {
  public name = "image";
  public ready = false;
  private ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null;

  async init(): Promise<void> {
    this.ffmpeg = await getFFmpeg();
    this.ready = true;
  }

  canConvert(from: string, to: string): boolean {
    return (
      SUPPORTED_IMAGE_FORMATS.includes(from) &&
      SUPPORTED_IMAGE_FORMATS.includes(to)
    );
  }

  async convert(file: FileData, outputFormat: string): Promise<FileData> {
    if (!this.ffmpeg) throw new Error("ImageHandler not initialized");

    const inputName = `input.${file.extension}`;
    const outputName = `output.${outputFormat}`;

    await this.ffmpeg.writeFile(inputName, file.buffer);
    await this.ffmpeg.exec(["-i", inputName, outputName]);

    const outputData = await this.ffmpeg.readFile(outputName) as Uint8Array;
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return {
      name: swapExtension(file.name, outputFormat),
      buffer: new Uint8Array(outputData),
      mimeType: `image/${outputFormat === "jpg" ? "jpeg" : outputFormat}`,
      extension: outputFormat,
    };
  }
}

export default ImageHandler;
