"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CapabilityManifest } from "@/features/capabilities";
import { INITIAL_JOB_STATE } from "@/features/jobs/reducer";
import type { JobState } from "@/features/jobs/types";
import type { WorkspaceJobRunner } from "@/features/jobs/workspace-runner";
import type { ManagedResult } from "@/features/results/result-manager";
import type { ValidationIssue } from "@/features/validation/types";
import { DropZone } from "./drop-zone";
import { JobError } from "./job-error";
import { JobProgress } from "./job-progress";
import { ResultPanel } from "./result-panel";

export type ToolWorkspaceProps = {
  capability: CapabilityManifest;
  runner: WorkspaceJobRunner;
  renderOptions?: (context: { disabled: boolean }) => ReactNode;
};

function defaultOptions(capability: CapabilityManifest): Readonly<Record<string, unknown>> {
  return Object.freeze(Object.fromEntries(capability.optionFields.map((field) => [field.key, field.defaultValue])));
}

export function ToolWorkspace({ capability, runner, renderOptions }: ToolWorkspaceProps) {
  const options = useMemo(() => defaultOptions(capability), [capability]);
  const [files, setFiles] = useState<readonly File[]>([]);
  const [issues, setIssues] = useState<readonly ValidationIssue[]>([]);
  const [state, setState] = useState<JobState>(INITIAL_JOB_STATE);
  const [result, setResult] = useState<ManagedResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [running, setRunning] = useState(false);
  const currentResultId = useRef<string | null>(null);
  const validationSequence = useRef(0);
  const errorSummary = useRef<HTMLDivElement>(null);

  const busy = running || state.phase === "loading-engine" || state.phase === "processing";
  const requiresFiles = capability.inputMode !== "values";
  const hasRequiredFiles = files.length >= capability.limits.minimumFiles;
  const canRun = !busy && !validating && issues.length === 0 && (!requiresFiles || hasRequiredFiles);

  const clearResult = useCallback(() => {
    if (currentResultId.current) runner.disposeResult(currentResultId.current);
    currentResultId.current = null;
    setResult(null);
  }, [runner]);

  useEffect(() => {
    const unsubscribe = runner.subscribe(setState);
    return () => {
      unsubscribe();
      if (currentResultId.current) runner.disposeResult(currentResultId.current);
      currentResultId.current = null;
      runner.dispose();
    };
  }, [runner]);

  useEffect(() => {
    if (issues.length > 0 || state.error) errorSummary.current?.focus();
  }, [issues, state.error]);

  const selectFiles = useCallback(async (selectedFiles: readonly File[]) => {
    const sequence = ++validationSequence.current;
    clearResult();
    setFiles(selectedFiles);
    setIssues([]);
    setValidating(true);
    try {
      const nextIssues = await runner.validateInputs(selectedFiles, options);
      if (sequence === validationSequence.current) setIssues(nextIssues);
    } finally {
      if (sequence === validationSequence.current) setValidating(false);
    }
  }, [clearResult, options, runner]);

  async function run(): Promise<void> {
    if (!canRun) return;
    clearResult();
    setRunning(true);
    try {
      const nextResult = await runner.run(files, options);
      currentResultId.current = nextResult.id;
      setResult(nextResult);
    } catch {
      // Runner only exposes normalized public state through its subscription.
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="tool-workspace" aria-labelledby="workspace-title">
      <header>
        <p className="workspace-eyebrow">{capability.category} tool</p>
        <h1 id="workspace-title">{capability.title}</h1>
        <p>{capability.description}</p>
      </header>
      <DropZone capability={capability} disabled={busy} files={files} onFilesChange={selectFiles} />
      {renderOptions ? <div className="workspace-options">{renderOptions({ disabled: busy || validating })}</div> : null}
      <JobError issues={issues} state={state} summaryRef={errorSummary} />
      <JobProgress state={state} />
      {state.warnings.length > 0 ? <aside className="workspace-warnings" aria-label="Conversion warnings"><strong>Warnings:</strong> {state.warnings.join(", ")}</aside> : null}
      <div className="workspace-actions">
        <button className="button button--primary" disabled={!canRun} onClick={run} type="button">Run conversion</button>
        {(state.phase === "loading-engine" || state.phase === "processing") ? <button className="button button--secondary" onClick={() => runner.cancel()} type="button">Cancel conversion</button> : null}
      </div>
      <ResultPanel result={result} />
    </section>
  );
}
