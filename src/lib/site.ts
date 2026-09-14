import type { Metadata } from "next";
import { capabilityRegistry, type CapabilityManifest } from "@/features/capabilities";

export const SITE_NAME = "Axel Tools";
export const MAIN_STUDIO_URL = "https://axelacademicstudio.my.id";

export type SiteEnvironment = "local" | "preview" | "production";

type SiteUrlInput = {
  environment?: SiteEnvironment;
  siteUrl?: string;
};

function currentEnvironment(): SiteEnvironment {
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return "local";
}

function defaultSiteUrl(environment: SiteEnvironment): string | undefined {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (environment === "production") return "https://tools.axelacademicstudio.my.id";
  return undefined;
}

export function resolveSiteUrl(input: SiteUrlInput = {}): URL {
  const environment = input.environment ?? currentEnvironment();
  const siteUrl = "siteUrl" in input ? input.siteUrl : defaultSiteUrl(environment);

  if (environment === "production" && !siteUrl) {
    throw new Error("SITE_URL is required in production");
  }
  const url = new URL(siteUrl ?? "http://localhost:3000");
  if (environment === "production" && url.protocol !== "https:") {
    throw new Error("SITE_URL must use HTTPS in production");
  }
  return url;
}

export function toolPath(slug: string): string {
  return `/tools/${slug}`;
}

export function getActiveCapabilities(
  manifests: readonly CapabilityManifest[] = capabilityRegistry,
): readonly CapabilityManifest[] {
  return manifests.filter((capability) => capability.releaseStatus === "active");
}

export function getActiveCapabilityBySlug(
  slug: string,
  manifests: readonly CapabilityManifest[] = capabilityRegistry,
): CapabilityManifest | undefined {
  return getActiveCapabilities(manifests).find((capability) => capability.slug === slug);
}

export function toolMetadata(capability: CapabilityManifest, siteUrl: URL): Metadata {
  const canonical = new URL(toolPath(capability.slug), siteUrl).toString();
  return {
    title: `${capability.title} | ${SITE_NAME}`,
    description: capability.description,
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}
