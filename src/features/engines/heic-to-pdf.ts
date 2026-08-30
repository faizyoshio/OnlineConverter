import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";

function isHeicFile(input: File): boolean {
  return input.type === "image/heic" || input.type === "image/heif" || /\.(heic|heif)$/i.test(input.name ?? "");
}

export function createHeicToPdfAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      if (isHeicFile(input)) {
        const bytes = await input.arrayBuffer();
        return { kind: "heic", probeRule: "heic-brand", bytes: bytes.byteLength };
      }
      return { kind: "unknown", probeRule: "unknown", bytes: 0 };
    },
    async validate(inputs: readonly File[], options: Readonly<Record<string, unknown>>): Promise<readonly ValidationIssue[]> {
      const issues: ValidationIssue[] = [];
      if (inputs.length === 0) {
        issues.push({ code: "malformed-input", field: "files", message: "At least one HEIC image is required." });
      }
      const pageSize = options.pageSize;
      if (!["a4"].includes(String(pageSize))) {
        issues.push({ code: "malformed-input", field: "pageSize", message: "Page size must be a4." });
      }
      const fit = options.fit;
      if (!["contain", "cover", "fill"].includes(String(fit))) {
        issues.push({ code: "malformed-input", field: "fit", message: "Fit must be contain, cover, or fill." });
      }
      const margin = options.marginMm;
      if (typeof margin !== "number" || margin < 0 || margin > 50) {
        issues.push({ code: "malformed-input", field: "marginMm", message: "Margin must be between 0 and 50 mm." });
      }
      const quality = options.jpegQuality;
      if (typeof quality !== "number" || quality < 1 || quality > 100) {
        issues.push({ code: "malformed-input", field: "jpegQuality", message: "JPEG quality must be between 1 and 100." });
      }
      return issues;
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}