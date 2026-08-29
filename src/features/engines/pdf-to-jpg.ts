/* eslint-disable @typescript-eslint/no-unused-vars */
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { WorkerLike } from "@/features/workers/adapter";
import type { WorkerRequest, WorkerResponse } from "@/features/workers/protocol";

class StubWorker implements WorkerLike {
  postMessage(_message: WorkerRequest): void {}
  addEventListener(_type: "message", _listener: (event: MessageEvent<WorkerResponse>) => void): void {}
  removeEventListener(_type: "message", _listener: (event: MessageEvent<WorkerResponse>) => void): void {}
  terminate(): void {}
}

export function createPdfToJpgAdapter() {
  return {
    async probe(_input: File): Promise<FileProbe> {
      return { kind: "pdf" as const, probeRule: "pdf-header" as const, bytes: 0 };
    },
    async validate(_inputs: readonly File[], _options: Readonly<Record<string, unknown>>): Promise<readonly ValidationIssue[]> {
      return [];
    },
    createWorker(): WorkerLike {
      return new StubWorker();
    },
  };
}

