import type { ConversionHandler, FileData } from "../core/types";
import { getFFmpeg } from "../utils/ffmpegLoader";
import { swapExtension } from "../utils/fileUtils";

const AUDIO_FORMATS = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus", "aiff", "wma", "amr", "ac3", "mid", "midi"];

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
  amr:  "audio/amr",
  ac3:  "audio/ac3",
  mid:  "audio/midi",
  midi: "audio/midi",
};

class AudioHandler implements ConversionHandler {
  public name = "audio";
  public ready = false;
  private ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null;

  async init(): Promise<void> {
    this.ffmpeg = await getFFmpeg();
    this.ready = true;
  }

  canConvert(from: string, to: string): boolean {
    const f = from.toLowerCase();
    const t = to.toLowerCase();
    return f !== t && AUDIO_FORMATS.includes(f) && AUDIO_FORMATS.includes(t);
  }

  async convert(file: FileData, outputFormat: string): Promise<FileData> {
    if (!this.ffmpeg) throw new Error("AudioHandler not initialized");

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
      mimeType: AUDIO_MIME[outputFormat] ?? "audio/mpeg",
      extension: outputFormat,
    };
  }
}

export default AudioHandler;
