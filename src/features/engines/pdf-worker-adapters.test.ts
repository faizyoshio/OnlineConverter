import { afterEach, describe, expect, test, vi } from "vitest";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { createPdfMergeAdapter } from "./pdf-merge";
import { createPdfSplitAdapter } from "./pdf-split";
import { createPdfRotateAdapter } from "./pdf-rotate";
import { createPdfDeletePagesAdapter } from "./pdf-delete-pages";
import { createPdfExtractPagesAdapter } from "./pdf-extract-pages";
import { createPdfOrganizeAdapter } from "./pdf-organize";
import { createPdfPageNumbersAdapter } from "./pdf-page-numbers";
import { createPdfWatermarkAdapter } from "./pdf-watermark";
import { createImageToPdfAdapter } from "./image-to-pdf";
import { createTextToPdfAdapter } from "./text-to-pdf";
import { createPdfCropAdapter } from "./pdf-crop";
import { createPdfResizeAdapter } from "./pdf-resize";
import { createPdfFlattenAdapter } from "./pdf-flatten";

class NativeWorkerDouble {
  static latest: NativeWorkerDouble | undefined;

  terminated = false;

  constructor(readonly url: URL, readonly options: WorkerOptions) {
    NativeWorkerDouble.latest = this;
  }

  postMessage(): void {}

  addEventListener(): void {}

  removeEventListener(): void {}

  terminate(): void {
    this.terminated = true;
  }
}

afterEach(() => vi.unstubAllGlobals());

describe("PDF worker adapters", () => {
  test.each([
    ["merge", createPdfMergeAdapter],
    ["split", createPdfSplitAdapter],
    ["rotate", createPdfRotateAdapter],
    ["delete", createPdfDeletePagesAdapter],
    ["extract", createPdfExtractPagesAdapter],
    ["organize", createPdfOrganizeAdapter],
    ["page-numbers", createPdfPageNumbersAdapter],
    ["watermark", createPdfWatermarkAdapter],
    ["image-to-pdf", createImageToPdfAdapter],
    ["text-to-pdf", createTextToPdfAdapter],
    ["crop", createPdfCropAdapter],
    ["resize", createPdfResizeAdapter],
    ["flatten", createPdfFlattenAdapter],
  ])("%s uses a module browser worker", (_name, createAdapter) => {
    vi.stubGlobal("Worker", NativeWorkerDouble);

    const worker = createAdapter().createWorker();

    expect(worker).toBeInstanceOf(BrowserWorkerBridge);
    expect(NativeWorkerDouble.latest).toEqual(expect.objectContaining({ options: { type: "module" } }));
    worker.terminate();
  });
});
