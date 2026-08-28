import type { CapabilityManifest } from "./schema";

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[←-⇿⟰-⟿]+/gu, " ")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasCompleteTokenCoverage(value: string, queryTokens: readonly string[]): boolean {
  const valueTokens = new Set(normalizeSearchText(value).split(" ").filter(Boolean));
  return queryTokens.length > 0 && queryTokens.every((token) => valueTokens.has(token));
}

function scoreCapability(query: string, queryTokens: readonly string[], manifest: CapabilityManifest): number {
  const title = normalizeSearchText(manifest.title);
  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (hasCompleteTokenCoverage(manifest.title, queryTokens)) return 60;

  const aliases = manifest.aliases.map(normalizeSearchText);
  if (aliases.includes(query)) return 50;
  if (manifest.aliases.some((alias) => hasCompleteTokenCoverage(alias, queryTokens))) return 30;
  if (hasCompleteTokenCoverage(manifest.description, queryTokens)) return 10;
  return 0;
}

export function searchCapabilities(
  query: string,
  manifests: readonly CapabilityManifest[],
): readonly CapabilityManifest[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [...manifests].sort((left, right) =>
      left.title.localeCompare(right.title, "en") || left.id.localeCompare(right.id, "en"),
    );
  }

  const queryTokens = normalizedQuery.split(" ");
  return manifests
    .map((manifest) => ({ manifest, score: scoreCapability(normalizedQuery, queryTokens, manifest) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) =>
      right.score - left.score ||
      left.manifest.title.localeCompare(right.manifest.title, "en") ||
      left.manifest.id.localeCompare(right.manifest.id, "en"),
    )
    .map(({ manifest }) => manifest);
}
