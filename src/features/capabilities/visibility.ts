import type { CapabilityManifest } from "./schema";

export type CatalogEnvironment = "local" | "preview" | "production";

export function getVisibleCapabilities(
  manifests: readonly CapabilityManifest[],
  context: { environment: CatalogEnvironment; previewRequested: boolean },
): readonly CapabilityManifest[] {
  return manifests.filter((item) => {
    if (item.releaseStatus === "active") return true;
    return item.releaseStatus === "planned" && context.environment !== "production" && context.previewRequested;
  });
}
