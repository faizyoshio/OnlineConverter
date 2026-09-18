import { describe, expect, test } from "vitest";
import { capabilityRegistry } from "@/features/capabilities";
import { getActiveCapabilities, getActiveCapabilityBySlug, resolveSiteUrl, toolMetadata, toolPath } from "./site";

const active = { ...capabilityRegistry[0]!, releaseStatus: "active" as const };

describe("site helpers", () => {
  test("returns only active capabilities for route lookup", () => {
    const activeCapabilities = getActiveCapabilities(capabilityRegistry);
    expect(activeCapabilities).toHaveLength(39);
    expect(getActiveCapabilityBySlug("merge-pdf", capabilityRegistry)?.id).toBe("pdf.merge");
    expect(getActiveCapabilityBySlug("compress-pdf", capabilityRegistry)?.id).toBe("pdf.compress");
    expect(getActiveCapabilityBySlug("compress-image", capabilityRegistry)?.id).toBe("image.compress");
    expect(getActiveCapabilityBySlug("word-to-pdf", capabilityRegistry)?.id).toBe("pdf.word-to-pdf");
    expect(getActiveCapabilityBySlug("zip-maker", capabilityRegistry)).toBeUndefined();
    expect(getActiveCapabilityBySlug("unit-converter", capabilityRegistry)).toBeUndefined();
    expect(getActiveCapabilityBySlug("scan-to-pdf", capabilityRegistry)).toBeUndefined();
  });

  test("builds canonical metadata only from active manifest fields", () => {
    const metadata = toolMetadata(active, new URL("https://converter.example"));
    expect(toolPath(active.slug)).toBe(`/tools/${active.slug}`);
    expect(metadata).toMatchObject({
      title: `${active.title} | Axel Tools`,
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