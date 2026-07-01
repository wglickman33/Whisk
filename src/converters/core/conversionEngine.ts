import type { ConversionHandler, ConversionResult, FileData } from "./types";
import ImageHandler from "../handlers/imageHandler";
import AudioHandler from "../handlers/audioHandler";
import VideoHandler from "../handlers/videoHandler";
import DataHandler from "../handlers/dataHandler";
import DocumentHandler from "../handlers/documentHandler";

const HANDLERS: ConversionHandler[] = [
  new ImageHandler(),
  new AudioHandler(),
  new VideoHandler(),
  new DataHandler(),
  new DocumentHandler(),
];

async function ensureHandler(handler: ConversionHandler): Promise<void> {
  if (!handler.ready) {
    await handler.init();
  }
}

export async function convert(
  file: FileData,
  outputFormat: string,
  _onProgress?: (progress: number) => void
): Promise<ConversionResult> {
  const from = file.extension.toLowerCase();
  const to = outputFormat.toLowerCase();

  if (from === to) {
    return { success: false, error: "Input and output formats are the same." };
  }

  const handler = HANDLERS.find((h) => h.canConvert(from, to));

  if (!handler) {
    return {
      success: false,
      error: `No handler found for converting ${from.toUpperCase()} to ${to.toUpperCase()}.`,
    };
  }

  try {
    await ensureHandler(handler);
    const result = await handler.convert(file, to);
    return { success: true, file: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during conversion.";
    return { success: false, error: message };
  }
}

export function getSupportedOutputFormats(inputExtension: string): string[] {
  const from = inputExtension.toLowerCase();
  const supported: string[] = [];
  for (const handler of HANDLERS) {
    const allFormats = [
      "jpg","png","webp","gif","bmp","tiff","avif","ico",
      "mp3","wav","ogg","flac","aac","m4a","opus",
      "mp4","webm","mov","avi","mkv",
      "pdf","txt","md","html","rtf",
      "json","csv","xml","yaml","toml",
    ];
    for (const to of allFormats) {
      if (to !== from && handler.canConvert(from, to)) {
        supported.push(to);
      }
    }
  }
  return [...new Set(supported)];
}
