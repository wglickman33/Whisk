import JsBarcode from "jsbarcode";
import type { BarcodeFormat } from "./barcode";
export {
  type BarcodeFormat,
  BARCODE_FORMAT_LABELS,
  validateBarcodeInput,
  type BarcodeValidation,
} from "./barcodeCore";

export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  value: string,
  format: BarcodeFormat,
  options?: { height?: number; displayValue?: boolean }
): void {
  JsBarcode(canvas, value, {
    format,
    height: options?.height ?? 80,
    displayValue: options?.displayValue ?? true,
    margin: 12,
    fontSize: 14,
  });
}
