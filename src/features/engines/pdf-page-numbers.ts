import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { probePdf } from "./pdf/probe";

function isPdfFile(input: File): boolean {
  return input.type === "application/pdf" || String(input.name ?? "").toLowerCase().endsWith(".pdf");
}

export function createPdfPageNumbersAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      return isPdfFile(input) ? probePdf(input) : { kind: "unknown", probeRule: "unknown", bytes: 0 };
    },
    async validate(_inputs, options): Promise<readonly ValidationIssue[]> {
      const start = options.start;
      if (typeof start !== "number" || start < 1 || start > 100000) {
        return [{ code: "malformed-input", field: "start", message: "Start number must be between 1 and 100000." }];
      }
      if (!["bottom-center"].includes(String(options.position))) {
        return [{ code: "malformed-input", field: "position", message: "Position must be bottom-center." }];
      }
      if (!["arabic"].includes(String(options.style))) {
        return [{ code: "malformed-input", field: "style", message: "Style must be arabic." }];
      }
      return [];
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
