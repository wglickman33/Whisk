import type { ConversionHandler, FileData } from "../core/types";
import { getFFmpeg } from "../utils/ffmpegLoader";
import { swapExtension } from "../utils/fileUtils";
import { mimeForImageFormat } from "../utils/imageUtils";

const VIDEO_FORMATS = ["mp4", "m4v", "webm", "mov", "avi", "mkv", "wmv", "3gp", "gif", "flv", "mpg", "mpeg", "ts"];
const VIDEO_OUTPUTS = ["mp4", "m4v", "webm", "mov", "avi", "mkv", "wmv", "3gp", "gif", "flv", "mpg", "mpeg", "ts"];
const EXTRACTED_AUDIO = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus", "aiff", "wma"];
const EXTRACTED_FRAMES = ["png", "jpg", "webp"];

const VIDEO_MIME: Record<string, string> = {
  mp4:  "video/mp4",
  m4v:  "video/x-m4v",
  webm: "video/webm",
  mov:  "video/quicktime",
  avi:  "video/x-msvideo",
  mkv:  "video/x-matroska",
  wmv:  "video/x-ms-wmv",
  "3gp": "video/3gpp",
  gif:  "image/gif",
  flv:  "video/x-flv",
  mpg:  "video/mpeg",
  mpeg: "video/mpeg",
  ts:   "video/mp2t",
};

const AUDIO_MIME: Record<string, string> = {
  mp3:  "audio/mpeg",
  wav:  "audio/wav",
  ogg:  "audio/ogg",
  flac: "audio/flac",
  aac:  "audio/aac",
  m4a:  "audio/mp4",
  opus: "audio/opus",
  aiff: "audio/aiff",
  wma:  "audio/x-ms-wma",
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
    const f = from.toLowerCase();
    const t = to.toLowerCase();
    if (f === t || !VIDEO_FORMATS.includes(f)) return false;
    if (VIDEO_OUTPUTS.includes(t)) return true;
    if (EXTRACTED_AUDIO.includes(t)) return true;
    if (EXTRACTED_FRAMES.includes(t)) return true;
    return false;
  }

  async convert(file: FileData, outputFormat: string): Promise<FileData> {
    if (!this.ffmpeg) throw new Error("VideoHandler not initialized");

    const inputName = `input.${file.extension}`;
    const outputName = `output.${outputFormat}`;

    await this.ffmpeg.writeFile(inputName, file.buffer);

    if (outputFormat === "gif") {
      const paletteName = "palette.png";
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
    } else if (EXTRACTED_AUDIO.includes(outputFormat)) {
      await this.ffmpeg.exec(["-i", inputName, "-vn", outputName]);
    } else if (EXTRACTED_FRAMES.includes(outputFormat)) {
      await this.ffmpeg.exec(["-i", inputName, "-frames:v", "1", outputName]);
    } else {
      await this.ffmpeg.exec(["-i", inputName, outputName]);
    }

    const outputData = await this.ffmpeg.readFile(outputName) as Uint8Array;
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    const mimeType =
      EXTRACTED_AUDIO.includes(outputFormat)
        ? (AUDIO_MIME[outputFormat] ?? "audio/mpeg")
        : EXTRACTED_FRAMES.includes(outputFormat)
          ? mimeForImageFormat(outputFormat)
          : (VIDEO_MIME[outputFormat] ?? "video/mp4");

    return {
      name: swapExtension(file.name, outputFormat),
      buffer: new Uint8Array(outputData),
      mimeType,
      extension: outputFormat,
    };
  }
}

export default VideoHandler;
