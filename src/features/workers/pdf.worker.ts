import { LocalWorkerRuntime } from "./local-runtime";
import { processPdfOperation } from "../engines/pdf/worker-operation";
import type { WorkerRequest } from "./protocol";

const runtime = new LocalWorkerRuntime((response) => {
  self.postMessage(response);
}, processPdfOperation);

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  void runtime.handle(event.data);
});
