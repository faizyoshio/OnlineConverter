import "client-only";
import type { CapabilityManifest } from "@/features/capabilities/schema";
import type { LocalWorkerResult, LocalValuePayload } from "@/features/workers/protocol";
import type { JobResultMetadata } from "@/features/jobs/types";

export type ManagedOutput = {
  url: string;
  mimeType: string;
  bytes: number;
  downloadName: string;
};

export type ManagedResult =
  | {
      id: string;
      mode: "files" | "selected-entries";
      outputs: readonly ManagedOutput[];
      metadata: JobResultMetadata;
    }
  | {
      id: string;
      mode: "value";
      value: LocalValuePayload;
      metadata: JobResultMetadata;
    };

const RESERVED_WINDOWS = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

function isUnsafeName(name: string): boolean {
  if (!name) return true;
  if (name.includes("\0")) return true;
  if (/^[a-zA-Z]:/.test(name)) return true;
  if (/^[\\\/]/.test(name)) return true;
  if (name.split(/[\\\/]/).some(seg => seg === "..")) return true;
  const base = name.replace(/^.*[\\\/]/, "");
  const baseNoExt = base.replace(/\.[^.]*$/, "");
  if (RESERVED_WINDOWS.has(baseNoExt.toUpperCase())) return true;
  if (base.length > 120) return true;
  return false;
}

const MIME_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/octet-stream": "bin",
  "application/zip": "zip",
  "image/svg+xml": "svg",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
};
function extFromMime(mime: string): string { return MIME_EXT[mime] ?? "bin"; }

export interface ResultManagerDeps {
  createId: () => string;
  createObjectURL: (blob: Blob) => string;
  revokeObjectURL: (url: string) => void;
}

interface Entry { urls: string[]; revoked: boolean }

export class ResultManager {
  readonly entries = new Map<string, Entry>();
  private readonly deps: ResultManagerDeps;
  constructor(deps: ResultManagerDeps) { this.deps = deps; }

  create(capability: CapabilityManifest, result: LocalWorkerResult): ManagedResult {
    if (result.mode !== capability.result.mode) throw new Error("Result mode mismatch");
    if (result.metadata.resultMode !== result.mode) throw new Error("Metadata resultMode mismatch");

    if (result.mode === "value") {
      const id = this.deps.createId();
      this.entries.set(id, { urls: [], revoked: false });
      return { id, mode: "value", value: result.value, metadata: result.metadata };
    }

    const outputs = result.outputs;
    if (outputs.length !== result.metadata.outputMimeTypes.length ||
        outputs.length !== result.metadata.outputBytes.length) {
      throw new Error("Metadata length mismatch");
    }
    for (let i = 0; i < outputs.length; i++) {
      if (outputs[i]!.blob.size !== result.metadata.outputBytes[i]) {
        throw new Error("Metadata size mismatch");
      }
    }

    const outDescs: { kind: string; mimeType: string; extension: string }[] = (capability.result as { files?: { kind: string; mimeType: string; extension: string }[] }).files ?? [];
    const hasOpaqueDescriptor = outDescs.some(d => d.kind === "binary" && d.extension === "preserve");
    const allowedMimes = outDescs.map(d => d.mimeType);

    const managedOutputs: ManagedOutput[] = [];
    const urls: string[] = [];

    for (let idx = 0; idx < outputs.length; idx++) {
      const out = outputs[idx]!;
      const blob = out.blob;
      const suggested = out.suggestedDownloadName;

      if (!allowedMimes.includes(blob.type) && !hasOpaqueDescriptor) {
        urls.forEach(u => this.deps.revokeObjectURL(u));
        throw new Error(`Undeclared mime ${blob.type}`);
      }

      let downloadName: string;
      if (result.mode === "selected-entries") {
        if (suggested !== undefined) {
          if (!hasOpaqueDescriptor) {
            urls.forEach(u => this.deps.revokeObjectURL(u));
            throw new Error("Suggested download name not allowed without opaque descriptor");
          }
          // For opaque binary descriptors, fallback uses .bin extension
          downloadName = isUnsafeName(suggested) ? `output-${idx+1}.bin` : suggested.replace(/^.*[\\\/]/, "");
        } else {
          downloadName = hasOpaqueDescriptor ? `output-${idx+1}.bin` : `output-${idx+1}.${extFromMime(blob.type)}`;
        }
      } else {
        if (suggested) {
          urls.forEach(u => this.deps.revokeObjectURL(u));
          throw new Error("Suggested download name not allowed for files mode");
        }
        downloadName = `output-${idx+1}.${extFromMime(blob.type)}`;
      }
      const url = this.deps.createObjectURL(blob);
      urls.push(url);
      managedOutputs.push({ url, mimeType: blob.type, bytes: blob.size, downloadName });
    }
    const id = this.deps.createId();
    this.entries.set(id, { urls, revoked: false });
    return { id, mode: result.mode, outputs: managedOutputs, metadata: result.metadata };
  }

  dispose(resultId: string): void {
    const entry = this.entries.get(resultId);
    if (!entry || entry.revoked) return;
    entry.urls.forEach(u => this.deps.revokeObjectURL(u));
    entry.revoked = true;
    this.entries.delete(resultId);
  }

  disposeAll(): void {
    for (const [, entry] of this.entries) {
      if (!entry.revoked) entry.urls.forEach(u => this.deps.revokeObjectURL(u));
    }
    this.entries.clear();
  }
}


