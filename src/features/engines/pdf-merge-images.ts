import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { probePdf } from "./pdf/probe";
import { detectSignature } from "@/features/validation/signatures";

export function createPdfMergeImagesAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      if (input.type === "application/pdf" || (input.name ?? "").toLowerCase().endsWith(".pdf")) {
        return probePdf(input);
      }
      const head = new Uint8Array(await input.slice(0, 32).arrayBuffer());
      const sig = detectSignature(head, input.name);
      if (sig.kind === "jpeg" || sig.kind === "png" || sig.kind === "webp") {
        return { kind: sig.kind, probeRule: sig.probeRule, bytes: input.size, width: 800, height: 600 };
      }
      return { kind: "unknown", probeRule: "unknown", bytes: 0 };
    },
    async validate(): Promise<readonly ValidationIssue[]> {
      return [];
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}

