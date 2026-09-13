import { describe, test, expect } from "vitest";
import { extractZip } from "@/engines/utility/operations";
import { capabilityRegistry } from "@/features/capabilities";
import type { LocalWorkerOperationContext } from "@/features/workers/local-runtime";
import { createArchiveZipCreateAdapter } from "./archive-zip-create";
import { processArchiveOperation } from "./archive/worker-operation";

function mockContext(overrides: Partial<LocalWorkerOperationContext> = {}): LocalWorkerOperationContext {
  return {
    capabilityId: "archive.zip-create",
    jobId: "test-zip-create-job",
    inputs: [],
    options: {},
    isCancelled: () => false,
    reportProgress: () => undefined,
    ...overrides,
  };
}

function fileWithPath(content: string | Uint8Array, name: string, relativePath = ""): File {
  const file = new File([content as BlobPart], name, { type: "text/plain" });
  Object.defineProperty(file, "webkitRelativePath", { configurable: true, value: relativePath });
  return file;
}

describe("archive.zip-create", () => {
  describe("manifest audit", () => {
    test("declares active releaseStatus and exact-structural result contract", () => {
      const manifest = capabilityRegistry.find((item) => item.id === "archive.zip-create");
      expect(manifest).toBeDefined();
      expect(manifest?.slug).toBe("zip-maker");
      expect(manifest?.category).toBe("utility");
      expect(manifest?.workerFamily).toBe("archive");
      expect(manifest?.releaseStatus).toBe("planned");
      expect(manifest?.resultContract).toBe("exact-structural");
      expect(manifest?.inputMode).toBe("files");
      expect(manifest?.result.mode).toBe("files");
      expect(manifest?.limits.minimumFiles).toBe(1);
      expect(manifest?.limits.maximumFiles).toBe(20);
      expect(manifest?.unsupportedCodes).toContain("unsafe-relative-name");
    });
  });

  describe("adapter probe", () => {
    test("probe returns expected kind for binary files", async () => {
      const adapter = createArchiveZipCreateAdapter();
      const probe = await adapter.probe(new File(["abc"], "test.txt", { type: "application/octet-stream" }));
      expect(probe.kind).toBe("binary");
      expect(probe.probeRule).toBe("opaque-local-file");
      expect(probe.bytes).toBe(3);
    });

    test("handles zero-byte file probe accurately", async () => {
      const adapter = createArchiveZipCreateAdapter();
      const probe = await adapter.probe(new File([], "empty.bin", { type: "application/octet-stream" }));
      expect(probe.kind).toBe("binary");
      expect(probe.probeRule).toBe("opaque-local-file");
      expect(probe.bytes).toBe(0);
    });
  });

  describe("adapter validate", () => {
    test("returns empty issues for empty inputs list", async () => {
      const adapter = createArchiveZipCreateAdapter();
      const issues = await adapter.validate([], {});
      expect(issues).toEqual([]);
    });

    test("returns empty issues for valid standard files", async () => {
      const adapter = createArchiveZipCreateAdapter();
      const files = [
        fileWithPath("content1", "file1.txt"),
        fileWithPath("content2", "file2.txt"),
      ];
      const issues = await adapter.validate(files, { preserveRelativeNames: true });
      expect(issues).toEqual([]);
    });

    describe("relative file paths", () => {
      test("preserves valid webkitRelativePath when preserveRelativeNames is true", async () => {
        const adapter = createArchiveZipCreateAdapter();
        const files = [
          fileWithPath("a", "file.txt", "folder/a/file.txt"),
          fileWithPath("b", "file.txt", "folder/b/file.txt"),
        ];
        const issues = await adapter.validate(files, { preserveRelativeNames: true });
        expect(issues).toEqual([]);
      });

      test("falls back to file.name when webkitRelativePath is empty", async () => {
        const adapter = createArchiveZipCreateAdapter();
        const files = [fileWithPath("hello", "standalone.txt", "")];
        const issues = await adapter.validate(files, { preserveRelativeNames: true });
        expect(issues).toEqual([]);
      });

      test("detects duplicate relative paths when preserveRelativeNames is true", async () => {
        const adapter = createArchiveZipCreateAdapter();
        const files = [
          fileWithPath("a", "dup.txt", "common/dup.txt"),
          fileWithPath("b", "dup.txt", "common/dup.txt"),
        ];
        const issues = await adapter.validate(files, { preserveRelativeNames: true });
        expect(issues).toEqual([
          { code: "malformed-input", field: "files", message: "One or more local archive names are unsafe or duplicated." },
        ]);
      });

      test("detects duplicate names when preserveRelativeNames is false even if relative paths differ", async () => {
        const adapter = createArchiveZipCreateAdapter();
        const files = [
          fileWithPath("a", "same.txt", "dir1/same.txt"),
          fileWithPath("b", "same.txt", "dir2/same.txt"),
        ];
        const issues = await adapter.validate(files, { preserveRelativeNames: false });
        expect(issues).toEqual([
          { code: "malformed-input", field: "files", message: "One or more local archive names are unsafe or duplicated." },
        ]);
      });
    });

    describe("unsafe paths", () => {
      test.each([
        ["parent traversal", "../secret.txt"],
        ["deep parent traversal", "folder/../../secret.txt"],
        ["leading forward slash", "/root/file.txt"],
        ["leading backslash", "\\windows\\file.txt"],
        ["Windows drive letter with backslash", "C:\\file.txt"],
        ["Windows drive letter with forward slash", "c:/file.txt"],
        ["current directory dot segment", "folder/./file.txt"],
        ["empty path segment (double slash)", "folder//file.txt"],
        ["null byte injection", "safe\0evil.txt"],
      ])("rejects %s: %s", async (_label, unsafePath) => {
        const adapter = createArchiveZipCreateAdapter();
        const files = [fileWithPath("payload", "sample.txt", unsafePath)];
        const issues = await adapter.validate(files, { preserveRelativeNames: true });
        expect(issues).toEqual([
          { code: "malformed-input", field: "files", message: "One or more local archive names are unsafe or duplicated." },
        ]);
      });

      test("rejects unsafe file.name when preserveRelativeNames is false", async () => {
        const adapter = createArchiveZipCreateAdapter();
        const files = [fileWithPath("payload", "../escape.txt")];
        const issues = await adapter.validate(files, { preserveRelativeNames: false });
        expect(issues).toEqual([
          { code: "malformed-input", field: "files", message: "One or more local archive names are unsafe or duplicated." },
        ]);
      });
    });

    describe("zero-byte files", () => {
      test("validates zero-byte files without issues", async () => {
        const adapter = createArchiveZipCreateAdapter();
        const files = [
          fileWithPath(new Uint8Array(0), "empty1.txt"),
          fileWithPath(new Uint8Array(0), "empty2.txt"),
        ];
        const issues = await adapter.validate(files, { preserveRelativeNames: true });
        expect(issues).toEqual([]);
      });
    });
  });

  describe("worker operation (processArchiveOperation)", () => {
    test("creates ZIP preserving relative file paths when preserveRelativeNames is true", async () => {
      const result = await processArchiveOperation(mockContext({
        inputs: [
          fileWithPath("alpha", "alpha.txt", "docs/alpha.txt"),
          fileWithPath("beta", "beta.txt", "images/beta.txt"),
        ],
        options: { preserveRelativeNames: true, deflateLevel: 6 },
      }));

      expect(result.mode).toBe("files");
      if (result.mode !== "files") throw new Error();
      expect(result.outputs).toHaveLength(1);
      expect(result.outputs[0]?.blob.type).toBe("application/zip");

      const extracted = await extractZip(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()));
      expect(extracted.map((e) => e.name).sort()).toEqual(["docs/alpha.txt", "images/beta.txt"]);
    });

    test("flattens to file.name when preserveRelativeNames is false", async () => {
      const result = await processArchiveOperation(mockContext({
        inputs: [
          fileWithPath("alpha", "alpha.txt", "docs/alpha.txt"),
          fileWithPath("beta", "beta.txt", "images/beta.txt"),
        ],
        options: { preserveRelativeNames: false, deflateLevel: 6 },
      }));

      expect(result.mode).toBe("files");
      if (result.mode !== "files") throw new Error();
      const extracted = await extractZip(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()));
      expect(extracted.map((e) => e.name).sort()).toEqual(["alpha.txt", "beta.txt"]);
    });

    test("creates ZIP containing zero-byte files and successfully extracts them", async () => {
      const result = await processArchiveOperation(mockContext({
        inputs: [
          fileWithPath(new Uint8Array(0), "empty.dat"),
          fileWithPath("hello", "nonempty.txt"),
        ],
        options: { preserveRelativeNames: true, deflateLevel: 6 },
      }));

      expect(result.mode).toBe("files");
      if (result.mode !== "files") throw new Error();
      const extracted = await extractZip(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()));
      expect(extracted).toHaveLength(2);

      const emptyEntry = extracted.find((e) => e.name === "empty.dat");
      expect(emptyEntry).toBeDefined();
      expect(emptyEntry?.bytes.byteLength).toBe(0);

      const nonemptyEntry = extracted.find((e) => e.name === "nonempty.txt");
      expect(nonemptyEntry).toBeDefined();
      expect(new TextDecoder().decode(nonemptyEntry?.bytes)).toBe("hello");
    });

    describe("deflate levels", () => {
      test("creates valid ZIP with deflateLevel 0 (uncompressed STORE)", async () => {
        const text = "Uncompressed repetitive content 1234567890".repeat(5);
        const result = await processArchiveOperation(mockContext({
          inputs: [fileWithPath(text, "store.txt")],
          options: { deflateLevel: 0 },
        }));

        expect(result.mode).toBe("files");
        if (result.mode !== "files") throw new Error();
        const extracted = await extractZip(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()));
        expect(new TextDecoder().decode(extracted[0]?.bytes)).toBe(text);
      });

      test("creates valid ZIP with deflateLevel 6 (default) and deflateLevel 9 (maximum)", async () => {
        const content = "Compression comparison payload with repeating patterns ".repeat(10);
        const res6 = await processArchiveOperation(mockContext({
          inputs: [fileWithPath(content, "file.txt")],
          options: { deflateLevel: 6 },
        }));
        const res9 = await processArchiveOperation(mockContext({
          inputs: [fileWithPath(content, "file.txt")],
          options: { deflateLevel: 9 },
        }));

        expect(res6.mode).toBe("files");
        expect(res9.mode).toBe("files");
        if (res6.mode !== "files" || res9.mode !== "files") throw new Error();
        expect(res6.outputs[0]!.blob.size).toBeGreaterThan(0);
        expect(res9.outputs[0]!.blob.size).toBeGreaterThan(0);

        const extracted6 = await extractZip(new Uint8Array(await res6.outputs[0]!.blob.arrayBuffer()));
        const extracted9 = await extractZip(new Uint8Array(await res9.outputs[0]!.blob.arrayBuffer()));
        expect(new TextDecoder().decode(extracted6[0]?.bytes)).toBe(content);
        expect(new TextDecoder().decode(extracted9[0]?.bytes)).toBe(content);
      });

      test("rejects invalid deflate levels outside 0-9", async () => {
        await expect(processArchiveOperation(mockContext({
          inputs: [fileWithPath("test", "test.txt")],
          options: { deflateLevel: 10 },
        }))).rejects.toThrow("Deflate level must be between 0 and 9");

        await expect(processArchiveOperation(mockContext({
          inputs: [fileWithPath("test", "test.txt")],
          options: { deflateLevel: -1 },
        }))).rejects.toThrow("Deflate level must be between 0 and 9");
      });
    });

    test("returns empty files result immediately when cancelled", async () => {
      const result = await processArchiveOperation(mockContext({
        inputs: [fileWithPath("cancelled", "test.txt")],
        options: { preserveRelativeNames: true },
        isCancelled: () => true,
      }));

      expect(result.mode).toBe("files");
      if (result.mode !== "files") throw new Error();
      expect(result.outputs).toEqual([]);
      expect(result.metadata.outputBytes).toEqual([]);
    });

    test("reports progress across expected stages", async () => {
      const stages: string[] = [];
      await processArchiveOperation(mockContext({
        inputs: [fileWithPath("sample", "test.txt")],
        options: { preserveRelativeNames: true },
        reportProgress: (_val, stage) => stages.push(stage),
      }));

      expect(stages).toEqual(["Reading local files", "Creating ZIP", "Finalizing ZIP"]);
    });
  });
});

