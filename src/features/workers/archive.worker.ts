import { processArchiveOperation } from "../engines/archive/worker-operation";
import { LocalWorkerRuntime } from "./local-runtime";
import type { WorkerRequest } from "./protocol";

const runtime = new LocalWorkerRuntime((response) => self.postMessage(response), processArchiveOperation);
self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => { void runtime.handle(event.data); });
