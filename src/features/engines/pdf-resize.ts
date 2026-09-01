import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { validatePdfResizeOptions } from "./pdf/options";
import { probePdf } from "./pdf/probe";

export function createPdfResizeAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    probe(input: File): Promise<FileProbe> {
      return probePdf(input);
    },
    async validate(_inputs, options): Promise<readonly ValidationIssue[]> {
      try {
        validatePdfResizeOptions(options);
        return [];
      } catch {
        return [{ code: "malformed-input", field: "options", message: "Only centered A4 fit resizing is supported." }];
      }
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
