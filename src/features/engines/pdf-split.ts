import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { probePdf } from "./pdf/probe";

function isPdfFile(input: File): boolean {
  if (input.type === "application/pdf") return true;
  const name = String(input.name ?? "").toLowerCase();
  return name.endsWith(".pdf");
}

export function createPdfSplitAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      if (!isPdfFile(input)) {
        return { kind: "unknown", probeRule: "unknown", bytes: 0 };
      }
      return probePdf(input);
    },
    async validate(_inputs, options): Promise<readonly ValidationIssue[]> {
      const ranges = options.ranges;
      if (ranges === null || ranges === undefined || ranges === "") return [];
      if (typeof ranges !== "string" || !ranges.split(",").every((part) => /^\s*\d+(?:-\d+)?\s*$/.test(part))) {
        return [{
          code: "malformed-input",
          field: "ranges",
          message: "Page ranges must use numbers or ranges such as 1, 3-5.",
        }];
      }
      return [];
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(
        new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }),
      );
    },
  };
}
