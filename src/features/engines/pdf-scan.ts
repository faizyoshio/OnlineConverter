import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";

function isImageFile(input: File): boolean {
  return (
    ["image/jpeg", "image/png", "image/webp"].includes(input.type) ||
    /\.(jpeg|jpg|png|webp)$/i.test(input.name ?? "")
  );
}

export function createPdfScanAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
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
    async validate(inputs: readonly File[]): Promise<readonly ValidationIssue[]> {
      if (inputs.length === 0) {
        return [{ code: "malformed-input", field: "files", message: "At least one image is required." }];
      }
      return [];
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
