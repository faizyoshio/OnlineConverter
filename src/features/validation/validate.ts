import type { CapabilityManifest } from "@/features/capabilities/schema";
import { UNIVERSAL_LIMITS } from "./limits";
import type { FileProbe, ValidationIssue } from "./types";

function issue(
  code: ValidationIssue["code"],
  field: string,
  message: string,
  measured?: number,
  limit?: number,
): ValidationIssue {
  return {
    code,
    field,
    message,
    ...(measured === undefined ? {} : { measured }),
    ...(limit === undefined ? {} : { limit }),
  };
}

function deduplicate(issues: readonly ValidationIssue[]): readonly ValidationIssue[] {
  const seen = new Set<string>();
  return issues.filter((item) => {
    const key = [item.code, item.field, item.measured ?? "", item.limit ?? "", item.message].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateBatch(files: readonly Pick<File, "size">[]): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (files.length > UNIVERSAL_LIMITS.batch.files) {
    issues.push(issue("limit-exceeded", "files", "A batch can contain at most 20 files.", files.length, UNIVERSAL_LIMITS.batch.files));
  }
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > UNIVERSAL_LIMITS.batch.bytes) {
    issues.push(issue("limit-exceeded", "batchBytes", "The combined input size exceeds the local batch limit.", totalBytes, UNIVERSAL_LIMITS.batch.bytes));
  }
  return issues;
}

export function validateProbe(probe: FileProbe, manifest: CapabilityManifest): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const opaqueZipInput = manifest.id === "archive.zip-create" && manifest.inputs.some((input) => input.probeRule === "opaque-local-file");
  const matchesInput = manifest.inputs.some((input) => input.kind === probe.kind && input.probeRule === probe.probeRule);
  if (!opaqueZipInput && !matchesInput) {
    issues.push(issue("unsupported-format", "format", "The detected local file format is not supported by this tool."));
  }

  const addLimit = (field: string, measured: number | undefined, limit: number, message: string) => {
    if (measured !== undefined && measured > limit) {
      issues.push(issue("limit-exceeded", field, message, measured, limit));
    }
  };

  for (const profile of manifest.limits.profiles) {
    if (profile === "pdf") {
      addLimit("bytes", probe.bytes, UNIVERSAL_LIMITS.pdf.bytes, "The PDF exceeds the local byte limit.");
      addLimit("pages", probe.pages, UNIVERSAL_LIMITS.pdf.pages, "The PDF exceeds the local page limit.");
    } else if (profile === "image") {
      addLimit("bytes", probe.bytes, UNIVERSAL_LIMITS.image.bytes, "The image exceeds the local byte limit.");
      const pixels = probe.width !== undefined && probe.height !== undefined ? probe.width * probe.height : undefined;
      addLimit("pixels", pixels, UNIVERSAL_LIMITS.image.pixels, "The image exceeds the local pixel limit.");
    } else if (profile === "video") {
      addLimit("bytes", probe.bytes, UNIVERSAL_LIMITS.video.bytes, "The video exceeds the local byte limit.");
      addLimit("durationSeconds", probe.durationSeconds, UNIVERSAL_LIMITS.video.durationSeconds, "The video exceeds the local duration limit.");
      addLimit("width", probe.width, UNIVERSAL_LIMITS.video.width, "The video exceeds the local width limit.");
      addLimit("height", probe.height, UNIVERSAL_LIMITS.video.height, "The video exceeds the local height limit.");
    } else if (profile === "audio") {
      addLimit("bytes", probe.bytes, UNIVERSAL_LIMITS.audio.bytes, "The audio exceeds the local byte limit.");
      addLimit("durationSeconds", probe.durationSeconds, UNIVERSAL_LIMITS.audio.durationSeconds, "The audio exceeds the local duration limit.");
    } else if (profile === "gif") {
      addLimit("bytes", probe.bytes, UNIVERSAL_LIMITS.gif.bytes, "The animation exceeds the local byte limit.");
      addLimit("durationSeconds", probe.durationSeconds, UNIVERSAL_LIMITS.gif.durationSeconds, "The animation exceeds the local duration limit.");
      addLimit("width", probe.width, UNIVERSAL_LIMITS.gif.width, "The animation exceeds the local width limit.");
      addLimit("height", probe.height, UNIVERSAL_LIMITS.gif.height, "The animation exceeds the local height limit.");
    } else if (profile === "zip") {
      addLimit("compressedBytes", probe.bytes, UNIVERSAL_LIMITS.zip.compressedBytes, "The ZIP exceeds the local compressed-size limit.");
      addLimit("expandedBytes", probe.expandedBytes, UNIVERSAL_LIMITS.zip.expandedBytes, "The ZIP exceeds the local expanded-size limit.");
      addLimit("archiveEntries", probe.archiveEntries, UNIVERSAL_LIMITS.zip.entries, "The ZIP contains too many entries.");
      addLimit("archiveDepth", probe.archiveDepth, UNIVERSAL_LIMITS.zip.depth, "The ZIP nesting depth exceeds the local limit.");
    } else if (profile === "ocr") {
      addLimit("ocrItems", probe.pages ?? 1, UNIVERSAL_LIMITS.ocr.items, "The OCR input exceeds the local item limit.");
    }
  }

  return deduplicate(issues);
}
