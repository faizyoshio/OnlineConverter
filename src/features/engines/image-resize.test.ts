import { describe, test, expect } from "vitest";
import { createImageResizeAdapter } from "./image-resize";

describe("Image Resize Adapter", () => {
  test("probe returns png kind with dimensions", async () => {
    const adapter = createImageResizeAdapter();
    const probe = await adapter.probe(new File([], "test.png", { type: "image/png" }));
    expect(probe.kind).toBe("png");
    expect(probe.width).toBe(100);
    expect(probe.height).toBe(100);
  });

  test("validate returns empty for valid inputs", async () => {
    const adapter = createImageResizeAdapter();
    const issues = await adapter.validate([new File([], "a.png", { type: "image/png" })], {});
    expect(issues).toEqual([]);
  });

  test("createWorker returns WorkerLike", () => {
    const adapter = createImageResizeAdapter();
    const worker = adapter.createWorker();
    expect(typeof worker.postMessage).toBe("function");
  });
});
