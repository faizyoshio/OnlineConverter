import "client-only";
import { inspectZip, normalizeArchiveName } from "@/engines/utility/operations";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";

export type ArchiveCapabilityId = "archive.zip-create" | "archive.zip-extract";

function malformedZipIssue(): ValidationIssue {
  return { code: "malformed-input", field: "files[0]", message: "The local ZIP archive is malformed or unsafe." };
}

async function zipBytes(input: File): Promise<Uint8Array> {
  const bytes = new Uint8Array(await input.arrayBuffer());
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || !([0x03, 0x05, 0x07].includes(bytes[2]!)) || !([0x04, 0x06, 0x08].includes(bytes[3]!))) {
    throw new Error("Invalid ZIP signature");
  }
  return bytes;
}

export function createArchiveAdapter(capabilityId: ArchiveCapabilityId): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      if (capabilityId === "archive.zip-create") return { kind: "binary", probeRule: "opaque-local-file", bytes: input.size };
      const bytes = await zipBytes(input);
      const inspection = await inspectZip(bytes);
      return { kind: "zip", probeRule: "zip-header", bytes: input.size, expandedBytes: inspection.expandedBytes, archiveEntries: inspection.archiveEntries, archiveDepth: inspection.archiveDepth };
    },
    async validate(inputs, options): Promise<readonly ValidationIssue[]> {
      if (inputs.length === 0) return [];
      if (capabilityId === "archive.zip-extract") {
        try { await inspectZip(await zipBytes(inputs[0]!)); return []; }
        catch { return [malformedZipIssue()]; }
      }
      const preserveRelativeNames = options.preserveRelativeNames !== false;
      const names = new Set<string>();
      try {
        for (const input of inputs) {
          const name = normalizeArchiveName((preserveRelativeNames ? input.webkitRelativePath : "") || input.name);
          if (names.has(name)) throw new Error("Duplicate archive name");
          names.add(name);
        }
        return [];
      } catch {
        return [{ code: "malformed-input", field: "files", message: "One or more local archive names are unsafe or duplicated." }];
      }
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../../workers/archive.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
