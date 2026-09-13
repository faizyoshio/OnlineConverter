import { capabilityRegistry } from "@/features/capabilities";
import { createActiveEngineRouter } from "./active-router";

test("registers exactly the release-gated adapters", () => {
  const router = createActiveEngineRouter();

  for (const capability of capabilityRegistry) {
    expect(router.has(capability.adapterKey), capability.id).toBe(capability.releaseStatus === "active");
  }
});

test.each([
  "pdf.merge",
  "pdf.split",
  "pdf.delete-pages",
  "pdf.extract-pages",
  "pdf.organize",
  "pdf.scan",
  "pdf.compress",
  "pdf.repair",
  "pdf.ocr",
  "pdf.image-to-pdf",
  "pdf.word-to-pdf",
  "pdf.powerpoint-to-pdf",
  "pdf.excel-to-pdf",
  "pdf.to-jpg",
  "pdf.pdf-to-word",
  "pdf.pdf-to-powerpoint",
  "pdf.pdf-to-excel",
])("registers the active adapter %s", (adapterKey) => {
  expect(createActiveEngineRouter().has(adapterKey)).toBe(true);
});
