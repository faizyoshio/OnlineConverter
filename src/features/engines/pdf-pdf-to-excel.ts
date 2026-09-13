import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { probePdf } from "./pdf/probe";

function isPdfFile(input: File): boolean {
  return input.type === "application/pdf" || String(input.name ?? "").toLowerCase().endsWith(".pdf");
}

export function createPdfToExcelAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      return isPdfFile(input) ? probePdf(input) : { kind: "unknown", probeRule: "unknown", bytes: 0 };
    },
    async validate(inputs: readonly File[]): Promise<readonly ValidationIssue[]> {
      if (inputs.length === 0) {
        return [{ code: "malformed-input", field: "files", message: "A PDF file is required." }];
      }
      return [];
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
