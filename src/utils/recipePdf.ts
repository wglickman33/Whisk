import type { Recipe } from "../api/client";
import { formatQuantity } from "./formatQuantity";

const ACCENT = { r: 0.788, g: 0.42, b: 0.227 };
const TEXT = { r: 0.12, g: 0.12, b: 0.12 };
const MUTED = { r: 0.42, g: 0.42, b: 0.42 };
const LINE = { r: 0.88, g: 0.86, b: 0.84 };

function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "recipe";
}

function formatServingsMeta(servings: number, servingUnit: string): string {
  const unit = servingUnit.trim();
  if (!unit || unit.toLowerCase() === "servings") {
    return `${servings} serving${servings === 1 ? "" : "s"}`;
  }
  return `${servings} ${unit}`;
}

function stripLeadingStepNumber(text: string): string {
  return text.trim().replace(/^\d+[.)]\s*/, "");
}

function wrapText(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function createRecipePdf(recipe: Recipe): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const contentWidth = pageWidth - margin * 2;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (height: number) => {
    if (y - height >= margin) return;
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const drawLine = (width = contentWidth) => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + width, y },
      thickness: 1,
      color: rgb(LINE.r, LINE.g, LINE.b),
    });
    y -= 14;
  };

  const drawSectionTitle = (label: string) => {
    ensureSpace(36);
    page.drawText(label.toUpperCase(), {
      x: margin,
      y,
      size: 11,
      font: bold,
      color: rgb(ACCENT.r, ACCENT.g, ACCENT.b),
    });
    y -= 16;
    drawLine(120);
    y -= 6;
  };

  page.drawText(recipe.title.trim(), {
    x: margin,
    y,
    size: 24,
    font: bold,
    color: rgb(TEXT.r, TEXT.g, TEXT.b),
  });
  y -= 30;

  if (recipe.description?.trim()) {
    for (const line of wrapText(recipe.description.trim(), regular, 11, contentWidth)) {
      ensureSpace(16);
      page.drawText(line, {
        x: margin,
        y,
        size: 11,
        font: regular,
        color: rgb(MUTED.r, MUTED.g, MUTED.b),
      });
      y -= 14;
    }
    y -= 6;
  }

  const metaParts: string[] = [];
  if (recipe.prepTime != null) metaParts.push(`Prep ${recipe.prepTime} min`);
  if (recipe.cookTime != null) metaParts.push(`Cook ${recipe.cookTime} min`);
  metaParts.push(formatServingsMeta(recipe.servings, recipe.servingUnit));
  ensureSpace(18);
  page.drawText(metaParts.join("  ·  "), {
    x: margin,
    y,
    size: 10,
    font: regular,
    color: rgb(MUTED.r, MUTED.g, MUTED.b),
  });
  y -= 22;

  if (recipe.tags && recipe.tags.length > 0) {
    page.drawText(recipe.tags.map(({ tag }) => tag.label).join("  ·  "), {
      x: margin,
      y,
      size: 10,
      font: regular,
      color: rgb(ACCENT.r, ACCENT.g, ACCENT.b),
    });
    y -= 22;
  }

  drawSectionTitle("Ingredients");
  for (const ing of [...recipe.ingredients].sort((a, b) => a.order - b.order)) {
    const qtyParts: string[] = [];
    if (ing.quantity > 0) qtyParts.push(formatQuantity(ing.quantity));
    if (ing.unit.trim()) qtyParts.push(ing.unit.trim());
    const qty = qtyParts.join(" ");
    const nameLine = qty ? `${qty}  ${ing.name.trim()}` : ing.name.trim();
    const note = ing.notes?.trim() ? ` (${ing.notes.trim()})` : "";
    const optional = ing.isOptional ? " - optional" : "";

    ensureSpace(16);
    page.drawCircle({
      x: margin + 4,
      y: y + 3,
      size: 2.5,
      color: rgb(ACCENT.r, ACCENT.g, ACCENT.b),
    });
    for (const line of wrapText(`${nameLine}${note}${optional}`, regular, 11, contentWidth - 16)) {
      page.drawText(line, {
        x: margin + 14,
        y,
        size: 11,
        font: regular,
        color: rgb(TEXT.r, TEXT.g, TEXT.b),
      });
      y -= 14;
      ensureSpace(14);
    }
    y -= 4;
  }

  y -= 8;
  drawSectionTitle("Instructions");
  for (const [index, step] of [...recipe.steps]
    .sort((a, b) => a.order - b.order)
    .entries()) {
    const instruction = stripLeadingStepNumber(step.instruction);
    const timer =
      step.timerMinutes != null && step.timerMinutes > 0
        ? ` (${step.timerMinutes} min)`
        : "";
    const lines = wrapText(`${instruction}${timer}`, regular, 11, contentWidth - 28);

    ensureSpace(20);
    page.drawText(String(index + 1), {
      x: margin,
      y,
      size: 11,
      font: bold,
      color: rgb(ACCENT.r, ACCENT.g, ACCENT.b),
    });

    for (const line of lines) {
      page.drawText(line, {
        x: margin + 22,
        y,
        size: 11,
        font: regular,
        color: rgb(TEXT.r, TEXT.g, TEXT.b),
      });
      y -= 14;
      ensureSpace(14);
    }
    y -= 6;
  }

  if (recipe.notes?.trim()) {
    y -= 4;
    drawSectionTitle("Notes");
    for (const line of wrapText(recipe.notes.trim(), regular, 11, contentWidth)) {
      ensureSpace(14);
      page.drawText(line, { x: margin, y, size: 11, font: regular, color: rgb(TEXT.r, TEXT.g, TEXT.b) });
      y -= 14;
    }
  }

  ensureSpace(24);
  drawLine();
  page.drawText("Exported from Whisk", {
    x: margin,
    y,
    size: 9,
    font: regular,
    color: rgb(MUTED.r, MUTED.g, MUTED.b),
  });

  return pdf.save();
}

export function recipePdfFilename(recipe: Recipe): string {
  return `${slugify(recipe.title)}.pdf`;
}
