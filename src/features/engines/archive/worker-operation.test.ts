import { describe, expect, test } from "vitest";
import { createZip, extractZip } from "@/engines/utility/operations";
import type { LocalWorkerOperationContext } from "@/features/workers/local-runtime";
import { processArchiveOperation } from "./worker-operation";

function context(overrides: Partial<LocalWorkerOperationContext> = {}): LocalWorkerOperationContext {
  return {
    capabilityId: "archive.zip-create",
    jobId: "archive-job",
    inputs: [],
    options: {},
    isCancelled: () => false,
    reportProgress: () => undefined,
    ...overrides,
  };
}

function fileWithPath(text: string, name: string, relativePath = ""): File {
  const file = new File([text], name, { type: "text/plain" });
  Object.defineProperty(file, "webkitRelativePath", { configurable: true, value: relativePath });
  return file;
}

async function zipFile(entries: readonly { name: string; text: string }[]): Promise<File> {
  const bytes = await createZip(entries.map((entry) => ({ name: entry.name, bytes: new TextEncoder().encode(entry.text) })));
  return new File([Uint8Array.from(bytes)], "archive.zip", { type: "application/zip" });
}

describe("archive worker operation", () => {
  test("creates a ZIP with preserved safe relative names and exact metadata", async () => {
    const progress: string[] = [];
    const result = await processArchiveOperation(context({
      inputs: [fileWithPath("alpha", "alpha.txt", "folder/alpha.txt"), fileWithPath("beta", "beta.txt")],
      options: { preserveRelativeNames: true, deflateLevel: 6 },
      reportProgress: (_value, stage) => progress.push(stage),
    }));

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected files result");
    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0]!.blob.type).toBe("application/zip");
    expect(result.metadata.outputBytes).toEqual([result.outputs[0]!.blob.size]);
    const entries = await extractZip(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()));
    expect(entries.map((entry) => entry.name)).toEqual(["folder/alpha.txt", "beta.txt"]);
    expect(progress).toEqual(["Reading local files", "Creating ZIP", "Finalizing ZIP"]);
  });

  test("extracts safe entries with basename-only managed download names when flattened", async () => {
    const result = await processArchiveOperation(context({
      capabilityId: "archive.zip-extract",
      inputs: [await zipFile([{ name: "folder/alpha.txt", text: "alpha" }, { name: "beta.txt", text: "beta" }])],
      options: { flatten: true, selectAllSafe: true },
    }));

    expect(result.mode).toBe("selected-entries");
    if (result.mode !== "selected-entries") throw new Error("Expected selected entries result");
    expect(result.outputs.map((output) => output.suggestedDownloadName)).toEqual(["alpha.txt", "beta.txt"]);
    await expect(result.outputs[0]!.blob.text()).resolves.toBe("alpha");
    expect(result.metadata.outputBytes).toEqual(result.outputs.map((output) => output.blob.size));
  });

  test("rejects flatten collisions before returning any output", async () => {
    await expect(processArchiveOperation(context({
      capabilityId: "archive.zip-extract",
      inputs: [await zipFile([{ name: "a/same.txt", text: "one" }, { name: "b/same.txt", text: "two" }])],
      options: { flatten: true, selectAllSafe: true },
    }))).rejects.toThrow("Duplicate flattened entry name");
  });

  test("returns no partial output after cancellation", async () => {
    const createResult = await processArchiveOperation(context({
      inputs: [fileWithPath("alpha", "alpha.txt")],
      options: { preserveRelativeNames: false, deflateLevel: 6 },
      isCancelled: () => true,
    }));
    expect(createResult.mode).toBe("files");
    if (createResult.mode === "files") expect(createResult.outputs).toEqual([]);

    const extractResult = await processArchiveOperation(context({
      capabilityId: "archive.zip-extract",
      inputs: [await zipFile([{ name: "alpha.txt", text: "alpha" }])],
      options: { flatten: false, selectAllSafe: true },
      isCancelled: () => true,
    }));
    expect(extractResult.mode).toBe("selected-entries");
    if (extractResult.mode === "selected-entries") expect(extractResult.outputs).toEqual([]);
  });
});
