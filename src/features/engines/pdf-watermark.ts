import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { probePdf } from "./pdf/probe";

export function createPdfWatermarkAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      if (input.type === "application/pdf" || String(input.name ?? "").toLowerCase().endsWith(".pdf")) {
        return probePdf(input);
      }
      const name = input.name.toLowerCase();
      const bytes = (await input.arrayBuffer()).byteLength;
      if (input.type === "image/png" || name.endsWith(".png")) return { kind: "png", probeRule: "png-signature", bytes };
      if (input.type === "image/webp" || name.endsWith(".webp")) return { kind: "webp", probeRule: "webp-riff", bytes };
      if (input.type === "image/jpeg" || /\.(?:jpe?g)$/.test(name)) return { kind: "jpeg", probeRule: "jpeg-soi", bytes };
      return { kind: "unknown", probeRule: "unknown", bytes: 0 };
    },
    async validate(inputs, options): Promise<readonly ValidationIssue[]> {
      const issues: ValidationIssue[] = [];
      const watermarkType = options.watermarkType;
      if (watermarkType !== "text" && watermarkType !== "image") {
        issues.push({ code: "malformed-input", field: "watermarkType", message: "Watermark type must be text or image." });
      }
      const opacity = options.opacity;
      if (typeof opacity !== "number" || opacity < 0 || opacity > 100) {
        issues.push({ code: "malformed-input", field: "opacity", message: "Opacity must be a number between 0 and 100." });
      }
      if (options.position !== "center") {
        issues.push({ code: "malformed-input", field: "position", message: "Position must be center." });
      }
      const pages = options.pages;
      if (pages !== "all" && (typeof pages !== "string" || !pages.split(",").every((part) => /^\s*\d+(?:-\d+)?\s*$/.test(part)))) {
        issues.push({ code: "malformed-input", field: "pages", message: "Pages must use all, numbers, or ranges such as 1, 3-5." });
      }
      const watermarkText = options.watermarkText;
      if (watermarkType === "text" && (typeof watermarkText !== "string" || !watermarkText.trim())) {
        issues.push({ code: "malformed-input", field: "watermarkText", message: "Watermark text is required." });
      }
      if (watermarkType === "image" && inputs.length !== 2) {
        issues.push({ code: "malformed-input", field: "files", message: "Select one PDF and one local watermark image." });
      }
      return issues;
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
