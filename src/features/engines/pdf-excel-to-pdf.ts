import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";

function isXlsxFile(input: File): boolean {
  const name = (input.name ?? "").toLowerCase();
  return (
    input.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls")
  );
}

export function createExcelToPdfAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      if (isXlsxFile(input)) {
        return { kind: "xlsx", probeRule: "zip-header", bytes: input.size };
      }
      return { kind: "unknown", probeRule: "unknown", bytes: 0 };
    },
    async validate(inputs: readonly File[]): Promise<readonly ValidationIssue[]> {
      if (inputs.length === 0) {
        return [{ code: "malformed-input", field: "files", message: "An Excel spreadsheet is required." }];
      }
      return [];
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
