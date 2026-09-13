import "client-only";
import type { ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { resolveImageEncodeOptions, type ImageCodecCapabilityId } from "./options";
import { probeRasterImage, type RasterImageDecoder } from "./probe";

export type ImageAdapterDependencies = {
  decode?: RasterImageDecoder;
};

export function createImageAdapter(
  capabilityId: ImageCodecCapabilityId,
  dependencies: ImageAdapterDependencies = {},
): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    probe(input) {
      return probeRasterImage(input, dependencies.decode);
    },
    async validate(_inputs, options): Promise<readonly ValidationIssue[]> {
      try {
        resolveImageEncodeOptions(capabilityId, options);
        return [];
      } catch {
        return [{ code: "malformed-input", field: "options", message: "Choose a supported output format and valid image encoding options." }];
      }
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../../workers/image.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
