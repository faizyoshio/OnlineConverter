import type { JobState } from "@/features/jobs/types";

type JobProgressProps = {
  state: JobState;
};

export function JobProgress({ state }: JobProgressProps) {
  const busy = state.phase === "loading-engine" || state.phase === "processing";
  if (!busy) return null;
  const label = state.stageLabel ?? "Processing locally";

  if (state.progress === null) {
    return <p className="workspace-progress" role="status">{label}</p>;
  }

  const percentage = Math.round(state.progress * 100);
  return (
    <div className="workspace-progress" aria-label={label} aria-valuemax={100} aria-valuemin={0} aria-valuenow={percentage} role="progressbar">
      <span>{label}</span>
      <strong>{percentage}%</strong>
    </div>
  );
}
