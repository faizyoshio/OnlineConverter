import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActiveToolWorkspace } from "@/components/workspace/active-tool-workspace";
import { getActiveCapabilities, getActiveCapabilityBySlug, resolveSiteUrl, toolMetadata } from "@/lib/site";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams(): { slug: string }[] {
  return getActiveCapabilities().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const capability = getActiveCapabilityBySlug(slug);
  return capability ? toolMetadata(capability, resolveSiteUrl()) : {};
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const capability = getActiveCapabilityBySlug(slug);
  if (!capability) notFound();
  return <ActiveToolWorkspace capability={capability} />;
}
