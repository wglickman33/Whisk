import type { ConversionHandler, FileData } from "../core/types";
import { getFFmpeg } from "../utils/ffmpegLoader";
import { swapExtension } from "../utils/fileUtils";

const SUPPORTED_VIDEO_FORMATS = [
  "mp4", "webm", "mov", "avi", "mkv", "gif",
];

const VIDEO_MIME: Record<string, string> = {
  mp4:  "video/mp4",
  webm: "video/webm",
  mov:  "video/quicktime",
  avi:  "video/x-msvideo",
  mkv:  "video/x-matroska",
  gif:  "image/gif",
};

class VideoHandler implements ConversionHandler {
  public name = "video";
  public ready = false;
  private ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null;

  async init(): Promise<void> {
    this.ffmpeg = await getFFmpeg();
    this.ready = true;
  }

  canConvert(from: string, to: string): boolean {
    return (
      SUPPORTED_VIDEO_FORMATS.includes(from) &&
      SUPPORTED_VIDEO_FORMATS.includes(to) &&
      from !== to
    );
  }

  async convert(file: FileData, outputFormat: string): Promise<FileData> {
    if (!this.ffmpeg) throw new Error("VideoHandler not initialized");

    const inputName = `input.${file.extension}`;
    const outputName = `output.${outputFormat}`;

    if (outputFormat === "gif") {
      const paletteName = "palette.png";
      await this.ffmpeg.writeFile(inputName, file.buffer);
      await this.ffmpeg.exec([
        "-i", inputName,
        "-vf", "fps=10,scale=480:-1:flags=lanczos,palettegen",
        paletteName,
      ]);
      await this.ffmpeg.exec([
        "-i", inputName, "-i", paletteName,
        "-filter_complex", "fps=10,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse",
        outputName,
      ]);
      await this.ffmpeg.deleteFile(paletteName);
    } else {
      await this.ffmpeg.writeFile(inputName, file.buffer);
      await this.ffmpeg.exec(["-i", inputName, outputName]);
    }

    const outputData = await this.ffmpeg.readFile(outputName) as Uint8Array;
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return {
      name: swapExtension(file.name, outputFormat),
      buffer: new Uint8Array(outputData),
      mimeType: VIDEO_MIME[outputFormat] ?? "video/mp4",
      extension: outputFormat,
    };
  }
}

export default VideoHandler;
