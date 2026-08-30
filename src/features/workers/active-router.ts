"use client";

import { EngineRouter } from "./router";

export function createActiveEngineRouter(): EngineRouter {
  const router = new EngineRouter();
  router.register("pdf.merge", async () => (await import("@/features/engines/pdf-merge")).createPdfMergeAdapter());
  router.register("pdf.split", async () => (await import("@/features/engines/pdf-split")).createPdfSplitAdapter());
  router.register("pdf.rotate", async () => (await import("@/features/engines/pdf-rotate")).createPdfRotateAdapter());
  router.register("pdf.delete-pages", async () => (await import("@/features/engines/pdf-delete-pages")).createPdfDeletePagesAdapter());
  router.register("pdf.extract-pages", async () => (await import("@/features/engines/pdf-extract-pages")).createPdfExtractPagesAdapter());
  router.register("pdf.organize", async () => (await import("@/features/engines/pdf-organize")).createPdfOrganizeAdapter());
  router.register("pdf.page-numbers", async () => (await import("@/features/engines/pdf-page-numbers")).createPdfPageNumbersAdapter());
  router.register("pdf.watermark", async () => (await import("@/features/engines/pdf-watermark")).createPdfWatermarkAdapter());
  router.register("pdf.text-to-pdf", async () => (await import("@/features/engines/text-to-pdf")).createTextToPdfAdapter());
  router.register("pdf.image-to-pdf", async () => (await import("@/features/engines/image-to-pdf")).createImageToPdfAdapter());
  return router;
}
