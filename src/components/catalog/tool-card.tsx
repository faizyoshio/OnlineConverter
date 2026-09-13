import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CapabilityManifest } from "@/features/capabilities/schema";

const contractLabels: Record<CapabilityManifest["resultContract"], string> = {
  "exact-structural": "Exact structure",
  "lossy-visual": "Lossy output",
  "best-effort-semantic": "Best effort",
};

type ToolCardProps = {
  capability: CapabilityManifest;
  previewMode: boolean;
};

const groupNames: Record<string, string> = {
  organize: "Organize",
  optimize: "Optimize",
  "to-pdf": "To PDF",
  "from-pdf": "From PDF",
};

function CardBody({ capability, previewMode }: ToolCardProps) {
  const categoryBadge = capability.group ? groupNames[capability.group] ?? capability.group : capability.category;
  return (
    <>
      <div className="tool-card__topline">
        <span className="tool-card__category">{categoryBadge}</span>
        {capability.releaseStatus === "planned" && previewMode ? <Badge>In development</Badge> : null}
      </div>
      <h3>{capability.title}</h3>
      <p>{capability.description}</p>
      <div className="tool-card__footer">
        <span>{contractLabels[capability.resultContract]}</span>
        <span aria-hidden="true">→</span>
      </div>
    </>
  );
}

export function ToolCard({ capability, previewMode }: ToolCardProps) {
  const className = "tool-card tool-card--" + capability.category;
  if (capability.releaseStatus === "active") {
    return (
      <Link aria-label={capability.title} className={className + " tool-card--active"} href={"/tools/" + capability.slug}>
        <CardBody capability={capability} previewMode={previewMode} />
      </Link>
    );
  }

  return (
    <Card className={className}>
      <CardBody capability={capability} previewMode={previewMode} />
    </Card>
  );
}
