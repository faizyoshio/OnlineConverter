"use client";

import { useMemo } from "react";
import type { CapabilityManifest } from "@/features/capabilities";
import { BrowserJobController } from "@/features/jobs/controller";
import { createWorkspaceJobRunner } from "@/features/jobs/workspace-runner";
import { ResultManager } from "@/features/results/result-manager";
import { capabilityValidator } from "@/features/validation/capability-validator";
import { createActiveEngineRouter } from "@/features/workers/active-router";
import { ToolWorkspace } from "./tool-workspace";

type ActiveToolWorkspaceProps = {
  capability: CapabilityManifest;
};

export function ActiveToolWorkspace({ capability }: ActiveToolWorkspaceProps) {
  const runner = useMemo(() => createWorkspaceJobRunner({
    capability,
    validator: capabilityValidator,
    router: createActiveEngineRouter(),
    results: new ResultManager({
      createId: () => crypto.randomUUID(),
      createObjectURL: (blob) => URL.createObjectURL(blob),
      revokeObjectURL: (url) => URL.revokeObjectURL(url),
    }),
    createController: (adapter, dispatch) => new BrowserJobController(adapter, dispatch),
  }), [capability]);

  return <ToolWorkspace capability={capability} runner={runner} />;
}
