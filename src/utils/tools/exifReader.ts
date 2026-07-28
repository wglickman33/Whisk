export interface ExifDisplayField {
  label: string;
  value: string;
}

const FIELD_LABELS: Record<string, string> = {
  Make: "Camera make",
  Model: "Camera model",
  DateTimeOriginal: "Date taken",
  ExposureTime: "Exposure time",
  FNumber: "Aperture",
  ISO: "ISO",
  FocalLength: "Focal length",
  LensModel: "Lens",
  ImageWidth: "Width",
  ImageHeight: "Height",
  Orientation: "Orientation",
  GPSLatitude: "GPS latitude",
  GPSLongitude: "GPS longitude",
};

export function formatExifFields(data: Record<string, unknown>): ExifDisplayField[] {
  const fields: ExifDisplayField[] = [];
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const value = data[key];
    if (value == null || value === "") continue;
    fields.push({ label, value: String(value) });
  }
  return fields;
}

export async function readExifFromFile(file: File): Promise<Record<string, unknown>> {
  const exifr = await import("exifr");
  const parsed = await exifr.parse(file, { reviveValues: true });
  return (parsed ?? {}) as Record<string, unknown>;
}
