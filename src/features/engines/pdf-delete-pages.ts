import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { probePdf } from "./pdf/probe";

function isPdfFile(input: File): boolean {
  return input.type === "application/pdf" || String(input.name ?? "").toLowerCase().endsWith(".pdf");
}

export function createPdfDeletePagesAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      return isPdfFile(input) ? probePdf(input) : { kind: "unknown", probeRule: "unknown", bytes: 0 };
    },
    async validate(_inputs, options): Promise<readonly ValidationIssue[]> {
      const pages = options.pages;
      if (!pages || typeof pages !== "string" || !pages.split(",").every((part) => /^\s*\d+(?:-\d+)?\s*$/.test(part))) {
        return [{ code: "malformed-input", field: "pages", message: "Pages to delete must use numbers or ranges such as 1, 3-5." }];
      }
      return [];
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
