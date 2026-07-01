export interface FileData {
  name: string;
  buffer: Uint8Array;
  mimeType: string;
  extension: string;
}

export interface FormatDefinition {
  extension: string;
  label: string;
  mimeType: string;
  category: FormatCategory;
}

export type FormatCategory = "image" | "audio" | "video" | "document" | "data";

export interface ConversionHandler {
  name: string;
  ready: boolean;
  init(): Promise<void>;
  canConvert(from: string, to: string): boolean;
  convert(file: FileData, outputFormat: string): Promise<FileData>;
}

export interface ConversionRoute {
  from: string;
  to: string;
  handler: string;
}

export interface ConversionResult {
  success: boolean;
  file?: FileData;
  error?: string;
}

export type ConversionStatus =
  | "idle"
  | "loading"
  | "converting"
  | "done"
  | "error";
