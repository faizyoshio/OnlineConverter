import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";

function isPptxFile(input: File): boolean {
  const name = (input.name ?? "").toLowerCase();
  return (
    input.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    name.endsWith(".pptx") ||
    name.endsWith(".ppt")
  );
}

export function createPowerpointToPdfAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      if (isPptxFile(input)) {
        return { kind: "pptx", probeRule: "zip-header", bytes: input.size };
      }
      return { kind: "unknown", probeRule: "unknown", bytes: 0 };
    },
    async validate(inputs: readonly File[]): Promise<readonly ValidationIssue[]> {
      if (inputs.length === 0) {
        return [{ code: "malformed-input", field: "files", message: "A PowerPoint presentation is required." }];
      }
      return [];
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
