import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";

function isImageFile(input: File): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(input.type) ||
    /\.(jpeg|jpg|png|webp)$/i.test(input.name ?? "");
}

export function createImageToPdfAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      if (isImageFile(input)) {
        const bytes = await input.arrayBuffer();
        const name = input.name.toLowerCase();
        if (input.type === "image/png" || name.endsWith(".png")) {
          return { kind: "png", probeRule: "png-signature", bytes: bytes.byteLength };
        }
        if (input.type === "image/webp" || name.endsWith(".webp")) {
          return { kind: "webp", probeRule: "webp-riff", bytes: bytes.byteLength };
        }
        return { kind: "jpeg", probeRule: "jpeg-soi", bytes: bytes.byteLength };
      }
      return { kind: "unknown", probeRule: "unknown", bytes: 0 };
    },
    async validate(inputs: readonly File[], options: Readonly<Record<string, unknown>>): Promise<readonly ValidationIssue[]> {
      const issues: ValidationIssue[] = [];
      if (inputs.length === 0) {
        issues.push({ code: "malformed-input", field: "files", message: "At least one image is required." });
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
      const order = options.order;
      if (!["input-order", "drag-order"].includes(String(order))) {
        issues.push({ code: "malformed-input", field: "order", message: "Order must be input-order or drag-order." });
      }
      return issues;
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
