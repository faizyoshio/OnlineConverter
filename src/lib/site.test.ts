import { describe, expect, test } from "vitest";
import { capabilityRegistry } from "@/features/capabilities";
import { getActiveCapabilities, getActiveCapabilityBySlug, resolveSiteUrl, toolMetadata, toolPath } from "./site";

const active = { ...capabilityRegistry[0]!, releaseStatus: "active" as const };

describe("site helpers", () => {
  test("returns only active capabilities for route lookup", () => {
    const activeCapabilities = getActiveCapabilities(capabilityRegistry);
    expect(activeCapabilities.map((capability) => capability.id)).toEqual([
      "pdf.merge",
      "pdf.split",
      "pdf.organize",
      "pdf.rotate",
      "pdf.crop",
      "pdf.resize",
      "pdf.delete-pages",
      "pdf.extract-pages",
      "pdf.page-numbers",
      "pdf.watermark",
      "pdf.image-to-pdf",
      "pdf.text-to-pdf",
      "image.jpg-to-modern",
      "image.webp-to-jpg",
      "image.webp-to-png",
      "image.jfif-to-png",
      "image.compress-jpeg",
      "image.compress-webp",
      "image.resize",
      "image.crop",
      "image.circle-crop",
      "image.rotate",
      "image.flip",
      "archive.zip-create",
      "archive.zip-extract",
      "utility.unit",
      "utility.time",
      "utility.barcode",
      "utility.password",
    ]);
    expect(getActiveCapabilityBySlug("merge-pdf", capabilityRegistry)?.id).toBe("pdf.merge");
    expect(getActiveCapabilityBySlug("zip-maker", capabilityRegistry)?.id).toBe("archive.zip-create");
    expect(getActiveCapabilityBySlug("unit-converter", capabilityRegistry)?.id).toBe("utility.unit");
    expect(getActiveCapabilityBySlug("compress-pdf", capabilityRegistry)).toBeUndefined();
  });

  test("builds canonical metadata only from active manifest fields", () => {
    const metadata = toolMetadata(active, new URL("https://converter.example"));
    expect(toolPath(active.slug)).toBe(`/tools/${active.slug}`);
    expect(metadata).toMatchObject({
      title: `${active.title} | OnlineConverter`,
      description: active.description,
      alternates: { canonical: `https://converter.example/tools/${active.slug}` },
    });
  });

  test("requires a HTTPS site URL in production", () => {
    expect(() => resolveSiteUrl({ environment: "production", siteUrl: "" })).toThrow("SITE_URL is required in production");
    expect(() => resolveSiteUrl({ environment: "production", siteUrl: "http://converter.example" })).toThrow("SITE_URL must use HTTPS in production");
    expect(resolveSiteUrl({ environment: "local", siteUrl: "http://localhost:3000" }).toString()).toBe("http://localhost:3000/");
  });
});
