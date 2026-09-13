import { capabilityRegistry } from "@/features/capabilities";
import { createActiveEngineRouter } from "./active-router";

test("registers exactly the release-gated adapters", () => {
  const router = createActiveEngineRouter();

  for (const capability of capabilityRegistry) {
    expect(router.has(capability.adapterKey), capability.id).toBe(capability.releaseStatus === "active");
  }
});

test.each([
  "pdf.crop",
  "pdf.resize",
  "image.jpg-to-modern",
  "image.webp-to-jpg",
  "image.webp-to-png",
  "image.jfif-to-png",
  "archive.zip-create",
  "archive.zip-extract",
  "utility.unit",
  "utility.time",
  "utility.barcode",
  "utility.password",
])("registers the newly reviewed adapter %s", (adapterKey) => {
  expect(createActiveEngineRouter().has(adapterKey)).toBe(true);
});
