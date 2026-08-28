import type { ProbeAndValidateAdapter } from "@/features/validation/types";
import type { WorkerRequest, WorkerResponse } from "./protocol";

export type WorkerMessageListener = (event: MessageEvent<WorkerResponse>) => void;

export interface WorkerLike {
  postMessage(message: WorkerRequest): void;
  addEventListener(type: "message", listener: WorkerMessageListener): void;
  removeEventListener(type: "message", listener: WorkerMessageListener): void;
  terminate(): void;
}

export interface EngineAdapter<TOptions extends Readonly<Record<string, unknown>>>
  extends ProbeAndValidateAdapter<TOptions> {
  createWorker(): WorkerLike;
}
