import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { probePdf } from "./pdf/probe";

function isPdfFile(input: File): boolean {
  if (input.type === "application/pdf") return true;
  const probe = String(input.name ?? "").toLowerCase();
  return probe.endsWith(".pdf");
}

export function createPdfFlattenAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      if (!isPdfFile(input)) {
        return { kind: "unknown", probeRule: "unknown", bytes: 0 };
      }
      return probePdf(input);
    },
    async validate(): Promise<readonly ValidationIssue[]> {
      return [];
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(
        new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }),
      );
    },
  };
}

