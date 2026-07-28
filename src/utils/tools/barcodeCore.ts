export type BarcodeFormat = "CODE128" | "EAN13" | "UPC" | "CODE39";

export const BARCODE_FORMAT_LABELS: Record<BarcodeFormat, string> = {
  CODE128: "Code 128 (general)",
  EAN13: "EAN-13 (products)",
  UPC: "UPC (US products)",
  CODE39: "Code 39 (inventory)",
};

export interface BarcodeValidation {
  ok: boolean;
  value?: string;
  error?: string;
}

export function validateBarcodeInput(format: BarcodeFormat, raw: string): BarcodeValidation {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Enter a value to encode." };

  switch (format) {
    case "CODE128":
      if (value.length > 80) return { ok: false, error: "Code 128 supports up to 80 characters." };
      return { ok: true, value };
    case "EAN13": {
      const digits = value.replace(/\s/g, "");
      if (!/^\d{12,13}$/.test(digits)) {
        return { ok: false, error: "EAN-13 needs 12 or 13 digits." };
      }
      return { ok: true, value: digits };
    }
    case "UPC": {
      const digits = value.replace(/\s/g, "");
      if (!/^\d{11,12}$/.test(digits)) {
        return { ok: false, error: "UPC needs 11 or 12 digits." };
      }
      return { ok: true, value: digits };
    }
    case "CODE39": {
      if (!/^[0-9A-Za-z\-.\s$\/+%*]+$/.test(value)) {
        return { ok: false, error: "Code 39 allows A–Z, 0–9, and - . $ / + % *" };
      }
      return { ok: true, value: value.toUpperCase() };
    }
    default:
      return { ok: false, error: "Unknown barcode format." };
  }
}
