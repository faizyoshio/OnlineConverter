import { createZip, extractZip } from "@/engines/utility/operations";
import type { LocalWorkerOperationContext } from "@/features/workers/local-runtime";
import type { LocalWorkerResult } from "@/features/workers/protocol";

function emptyResult(mode: "files" | "selected-entries"): LocalWorkerResult {
  return { mode, outputs: [], metadata: { resultMode: mode, outputMimeTypes: [], outputBytes: [] } };
}

function blob(bytes: Uint8Array, type: string): Blob {
  return new Blob([Uint8Array.from(bytes)], { type });
}

function basename(name: string): string {
  return name.replace(/^.*[\\/]/, "");
}

function uniqueDownloadNames(names: readonly string[], flatten: boolean): string[] {
  const seen = new Set<string>();
  return names.map((name) => {
    const candidate = flatten ? basename(name) : name.replace(/[\\/]+/g, "-");
    const key = candidate.toLocaleLowerCase("en-US");
    if (seen.has(key)) throw new Error("Duplicate flattened entry name");
    seen.add(key);
    return candidate;
  });
}

export async function processArchiveOperation(context: LocalWorkerOperationContext): Promise<LocalWorkerResult> {
  const { capabilityId, inputs, options, isCancelled, reportProgress } = context;
  if (capabilityId === "archive.zip-create") {
    if (isCancelled()) return emptyResult("files");
    reportProgress(0.1, "Reading local files");
    const preserveRelativeNames = options.preserveRelativeNames !== false;
    const entries = [];
    for (const input of inputs) {
      if (isCancelled()) return emptyResult("files");
      const relativeName = preserveRelativeNames ? input.webkitRelativePath : "";
      entries.push({ name: relativeName || input.name, bytes: new Uint8Array(await input.arrayBuffer()) });
    }
    reportProgress(0.55, "Creating ZIP");
    const bytes = await createZip(entries, { deflateLevel: Number(options.deflateLevel ?? 6) });
    if (isCancelled()) return emptyResult("files");
    reportProgress(0.95, "Finalizing ZIP");
    const output = blob(bytes, "application/zip");
    return { mode: "files", outputs: [{ blob: output }], metadata: { resultMode: "files", outputMimeTypes: [output.type], outputBytes: [output.size] } };
  }

  if (capabilityId === "archive.zip-extract") {
    if (isCancelled()) return emptyResult("selected-entries");
    const input = inputs[0];
    if (!input) throw new Error("A ZIP input is required");
    reportProgress(0.1, "Reading ZIP directory");
    const entries = await extractZip(new Uint8Array(await input.arrayBuffer()));
    if (isCancelled()) return emptyResult("selected-entries");
    const flatten = options.flatten === true;
    const names = uniqueDownloadNames(entries.map((entry) => entry.name), flatten);

    if (options.selectAllSafe === false) {
      reportProgress(0.65, "Bundling safe entries");
      const bytes = await createZip(entries.map((entry, index) => ({ name: names[index]!, bytes: entry.bytes })));
      if (isCancelled()) return emptyResult("selected-entries");
      const output = blob(bytes, "application/zip");
      reportProgress(0.95, "Finalizing extraction");
      return { mode: "selected-entries", outputs: [{ blob: output, suggestedDownloadName: "selected-entries.zip" }], metadata: { resultMode: "selected-entries", outputMimeTypes: [output.type], outputBytes: [output.size] } };
    }

    reportProgress(0.65, "Extracting safe entries");
    const outputs = entries.map((entry, index) => ({ blob: blob(entry.bytes, "application/octet-stream"), suggestedDownloadName: names[index]! }));
    if (isCancelled()) return emptyResult("selected-entries");
    reportProgress(0.95, "Finalizing extraction");
    return { mode: "selected-entries", outputs, metadata: { resultMode: "selected-entries", outputMimeTypes: outputs.map((output) => output.blob.type), outputBytes: outputs.map((output) => output.blob.size) } };
  }

  throw new Error(`Unknown archive capability: ${capabilityId}`);
}
