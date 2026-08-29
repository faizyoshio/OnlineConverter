import type { MetadataRoute } from "next";
import { getActiveCapabilities, resolveSiteUrl, toolPath } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveSiteUrl();
  return [
    { url: siteUrl.toString() },
    ...getActiveCapabilities().map((capability) => ({ url: new URL(toolPath(capability.slug), siteUrl).toString() })),
  ];
}
