import { describe, expect, test } from "vitest";
import { capabilityRegistry } from "@/features/capabilities";
import { getActiveCapabilities, getActiveCapabilityBySlug, resolveSiteUrl, toolMetadata, toolPath } from "./site";

const active = { ...capabilityRegistry[0]!, releaseStatus: "active" as const };

describe("site helpers", () => {
  test("keeps planned capabilities out of active route lookup", () => {
    expect(getActiveCapabilities(capabilityRegistry)).toEqual([]);
    expect(getActiveCapabilityBySlug(capabilityRegistry[0]!.slug, capabilityRegistry)).toBeUndefined();
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
    expect(() => resolveSiteUrl({ environment: "production" })).toThrow("SITE_URL is required in production");
    expect(() => resolveSiteUrl({ environment: "production", siteUrl: "http://converter.example" })).toThrow("SITE_URL must use HTTPS in production");
    expect(resolveSiteUrl({ environment: "local" }).toString()).toBe("http://localhost:3000/");
  });
});
