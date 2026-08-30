import "client-only";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";

function isTextFile(input: File): boolean {
  return input.type === "text/plain" || String(input.name ?? "").toLowerCase().endsWith(".txt");
}

export function createTextToPdfAdapter(): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      if (isTextFile(input)) {
        const bytes = await input.arrayBuffer();
        return { kind: "text", probeRule: "utf8-text", bytes: bytes.byteLength };
      }
      return { kind: "unknown", probeRule: "unknown", bytes: 0 };
    },
    async validate(_inputs: readonly File[], options: Readonly<Record<string, unknown>>): Promise<readonly ValidationIssue[]> {
      const issues: ValidationIssue[] = [];
      const pageSize = options.pageSize;
      if (!["a4"].includes(String(pageSize))) {
        issues.push({ code: "malformed-input", field: "pageSize", message: "Page size must be a4." });
      }
      const orientation = options.orientation;
      if (!["portrait", "landscape"].includes(String(orientation))) {
        issues.push({ code: "malformed-input", field: "orientation", message: "Orientation must be portrait or landscape." });
      }
      const fontSize = options.fontSizePt;
      if (typeof fontSize !== "number" || fontSize < 6 || fontSize > 72) {
        issues.push({ code: "malformed-input", field: "fontSizePt", message: "Font size must be between 6 and 72." });
      }
      const wrap = options.wrap;
      if (typeof wrap !== "boolean") {
        issues.push({ code: "malformed-input", field: "wrap", message: "Wrap must be a boolean." });
      }
      return issues;
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}