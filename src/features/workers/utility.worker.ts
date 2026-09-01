import { processUtilityOperation } from "../engines/utility/worker-operation";
import { LocalWorkerRuntime } from "./local-runtime";
import type { WorkerRequest } from "./protocol";

const runtime = new LocalWorkerRuntime((response) => self.postMessage(response), processUtilityOperation);
self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => { void runtime.handle(event.data); });
