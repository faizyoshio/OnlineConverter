import { describe, test, expect } from "vitest";
import { createPdfMergeAdapter } from "./pdf-merge";

describe("PDF Merge Adapter", () => {
  test("probe returns pdf kind and pdf-header rule", async () => {
    const adapter = createPdfMergeAdapter();
    const probe = await adapter.probe(new File([], "test.pdf", { type: "application/pdf" }));
    expect(probe.kind).toBe("pdf");
    expect(probe.probeRule).toBe("pdf-header");
  });

  test("validate returns empty array for valid inputs", async () => {
    const adapter = createPdfMergeAdapter();
    const issues = await adapter.validate(
      [new File([], "a.pdf", { type: "application/pdf" }), new File([], "b.pdf", { type: "application/pdf" })],
      {},
    );
    expect(issues).toEqual([]);
  });

  test("createWorker returns a WorkerLike instance", () => {
    const adapter = createPdfMergeAdapter();
    const worker = adapter.createWorker();
    expect(worker).toBeDefined();
    expect(typeof worker.postMessage).toBe("function");
    expect(typeof worker.terminate).toBe("function");
  });
});
