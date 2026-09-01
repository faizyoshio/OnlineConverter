import type { PdfCropMargins } from "@/engines/pdf/operations";

export type PdfCropOptions = {
  marginsMm: PdfCropMargins;
  pages: string;
  applyToAll: boolean;
};

export function parsePdfCropOptions(options: Readonly<Record<string, unknown>>): PdfCropOptions {
  const parts = typeof options.cropBox === "string"
    ? options.cropBox.split(",").map((part) => Number(part.trim()))
    : [];
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part) || part < 0 || part > 200)) {
    throw new Error("Crop margins must contain four millimetre values between 0 and 200");
  }
  const applyToAll = options.applyToAll === true;
  const pages = typeof options.pages === "string" ? options.pages.trim() : "";
  if (!applyToAll && !pages) throw new Error("A page selection is required");
  return {
    marginsMm: { left: parts[0]!, top: parts[1]!, right: parts[2]!, bottom: parts[3]! },
    pages,
    applyToAll,
  };
}

export function cropMarginsToPoints(marginsMm: PdfCropMargins): PdfCropMargins {
  const scale = 72 / 25.4;
  return {
    left: marginsMm.left * scale,
    top: marginsMm.top * scale,
    right: marginsMm.right * scale,
    bottom: marginsMm.bottom * scale,
  };
}

export function validatePdfResizeOptions(options: Readonly<Record<string, unknown>>): void {
  if (options.pageSize !== "a4" || options.fit !== "fit" || options.alignment !== "center") {
    throw new Error("Only centered A4 fit resizing is supported");
  }
}
