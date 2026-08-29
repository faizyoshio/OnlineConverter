import type { RefObject } from "react";
import type { JobState } from "@/features/jobs/types";
import type { ValidationIssue } from "@/features/validation/types";

type JobErrorProps = {
  issues: readonly ValidationIssue[];
  state: JobState;
  summaryRef: RefObject<HTMLDivElement | null>;
};

export function JobError({ issues, state, summaryRef }: JobErrorProps) {
  const messages = [
    ...issues.map((issue) => issue.message),
    ...(state.error ? [state.error.publicMessage] : []),
  ];
  if (messages.length === 0) return null;

  return (
    <div className="workspace-error" ref={summaryRef} role="alert" tabIndex={-1}>
      <strong>Fix these items before continuing.</strong>
      <ul>{messages.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}</ul>
    </div>
  );
}
