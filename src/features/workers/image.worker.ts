import { processImageOperation } from "../engines/image/worker-operation";
import { LocalWorkerRuntime } from "./local-runtime";
import type { WorkerRequest } from "./protocol";

const runtime = new LocalWorkerRuntime((response) => self.postMessage(response), processImageOperation);
self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => { void runtime.handle(event.data); });
