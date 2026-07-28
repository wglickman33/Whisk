import type { ConversionHandler, ConversionResult, FileData } from "./types";
import ImageHandler from "../handlers/imageHandler";
import AudioHandler from "../handlers/audioHandler";
import VideoHandler from "../handlers/videoHandler";
import DataHandler from "../handlers/dataHandler";
import DocumentHandler from "../handlers/documentHandler";
import { ALL_FORMAT_EXTENSIONS, normalizeExtension } from "../utils/fileUtils";

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
  onProgress?: (progress: number) => void
): Promise<ConversionResult> {
  const from = normalizeExtension(file.extension.toLowerCase());
  const to = normalizeExtension(outputFormat.toLowerCase());

  if (from === to) {
    return { success: false, error: "Input and output formats are the same." };
  }

  const handler = HANDLERS.find((h) => h.canConvert(from, to));

  if (!handler) {
    return {
      success: false,
      error: `No conversion available from ${from.toUpperCase()} to ${to.toUpperCase()}.`,
    };
  }

  try {
    await ensureHandler(handler);
    if (handler.name === "audio" || handler.name === "video") {
      const { getFFmpeg } = await import("../utils/ffmpegLoader");
      await getFFmpeg(onProgress);
    }
    const result = await handler.convert(file, to);
    return { success: true, file: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during conversion.";
    return { success: false, error: message };
  }
}

export function getSupportedOutputFormats(inputExtension: string): string[] {
  const from = normalizeExtension(inputExtension.toLowerCase());
  const supported: string[] = [];

  for (const to of ALL_FORMAT_EXTENSIONS) {
    const normalizedTo = normalizeExtension(to);
    if (normalizedTo === from) continue;
    if (HANDLERS.some((handler) => handler.canConvert(from, normalizedTo))) {
      supported.push(normalizedTo);
    }
  }

  return [...new Set(supported)];
}

export function getHandlerForConversion(from: string, to: string): ConversionHandler | undefined {
  const f = normalizeExtension(from.toLowerCase());
  const t = normalizeExtension(to.toLowerCase());
  return HANDLERS.find((h) => h.canConvert(f, t));
}
