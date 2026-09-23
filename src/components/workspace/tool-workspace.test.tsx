import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { capabilityRegistry, type CapabilityManifest } from "@/features/capabilities";
import { INITIAL_JOB_STATE } from "@/features/jobs/reducer";
import type { JobState } from "@/features/jobs/types";
import type { WorkspaceJobRunner } from "@/features/jobs/workspace-runner";
import type { ManagedResult } from "@/features/results/result-manager";
import type { ValidationIssue } from "@/features/validation/types";
import { ToolWorkspace } from "./tool-workspace";

function capability(id: string): CapabilityManifest {
  const match = capabilityRegistry.find((item) => item.id === id);
  if (!match) throw new Error(`Missing test capability ${id}`);
  return match;
}

function filesResult(id = "result-1"): ManagedResult {
  return {
    id,
    mode: "files",
    metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [10] },
    outputs: [{ url: `blob:${id}`, mimeType: "application/pdf", bytes: 10, downloadName: "output-1.pdf" }],
  };
}

function createRunnerHarness() {
  let issues: readonly ValidationIssue[] = [];
  let result: ManagedResult = filesResult();
  const listeners = new Set<(state: JobState) => void>();
  const runner: WorkspaceJobRunner = {
    subscribe: vi.fn((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    validateInputs: vi.fn(async () => issues),
    run: vi.fn(async () => result),
    cancel: vi.fn(),
    disposeResult: vi.fn(),
    dispose: vi.fn(),
  };

  return {
    runner,
    emit(state: JobState) {
      for (const listener of listeners) listener(state);
    },
    setIssues(next: readonly ValidationIssue[]) { issues = next; },
    setResult(next: ManagedResult) { result = next; },
  };
}

afterEach(() => vi.restoreAllMocks());

describe("ToolWorkspace", () => {
  test("renders value tools without a file picker and passes edited values to the runner", async () => {
    const user = userEvent.setup();
    const harness = createRunnerHarness();
    harness.setResult({
      id: "unit-1",
      mode: "value",
      value: { kind: "number", display: "1000 m", numericValue: 1000, unit: "m" },
      metadata: { resultMode: "value", outputMimeTypes: [], outputBytes: [] },
    });
    render(<ToolWorkspace capability={capability("utility.unit")} runner={harness.runner} />);

    expect(screen.queryByLabelText(/choose files/i)).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText(/^value$/i));
    await user.type(screen.getByLabelText(/^value$/i), "1");
    await user.clear(screen.getByLabelText(/from unit/i));
    await user.type(screen.getByLabelText(/from unit/i), "km");
    await user.clear(screen.getByLabelText(/to unit/i));
    await user.type(screen.getByLabelText(/to unit/i), "m");
    await user.click(screen.getByRole("button", { name: /run conversion/i }));

    expect(harness.runner.run).toHaveBeenCalledWith([], expect.objectContaining({
      value: 1,
      category: "length",
      fromUnit: "km",
      toUnit: "m",
    }));
    expect(await screen.findByText("1000 m")).toBeVisible();
  });

  test("validates selected files before enabling conversion and focuses validation summary", async () => {
    const user = userEvent.setup();
    const harness = createRunnerHarness();
    harness.setIssues([{ code: "unsupported-format", field: "files", message: "Choose a PDF file." }]);
    render(<ToolWorkspace capability={capability("pdf.merge")} runner={harness.runner} />);

    const input = screen.getByLabelText(/choose files/i);
    expect(input).toHaveAttribute("accept", "application/pdf,.pdf");
    await user.upload(input, new File(["not a pdf"], "wrong.pdf", { type: "application/pdf" }));

    await waitFor(() => expect(harness.runner.validateInputs).toHaveBeenCalledTimes(1));
    const summary = await screen.findByRole("alert");
    expect(summary).toHaveTextContent("Choose a PDF file.");
    expect(summary).toHaveFocus();
    expect(screen.getByRole("button", { name: /run conversion/i })).toBeDisabled();
  });

  test("passes changed page-range options to split validation", async () => {
    const user = userEvent.setup();
    const harness = createRunnerHarness();
    render(<ToolWorkspace capability={capability("pdf.split")} runner={harness.runner} />);

    await user.clear(screen.getByLabelText(/page ranges/i));
    await user.type(screen.getByLabelText(/page ranges/i), "1-2");
    await user.upload(screen.getByLabelText(/choose files/i), new File(["%PDF"], "source.pdf", { type: "application/pdf" }));

    await waitFor(() => expect(harness.runner.validateInputs).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ ranges: "1-2", onePerRange: true }),
    ));
  });

  test("shows determinate and indeterminate local progress plus cancel only while busy", () => {
    const harness = createRunnerHarness();
    render(<ToolWorkspace capability={capability("pdf.merge")} runner={harness.runner} />);

    act(() => harness.emit({ ...INITIAL_JOB_STATE, phase: "processing", progress: 0.25, stageLabel: "Merging locally" }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    expect(screen.getByRole("button", { name: /cancel conversion/i })).toBeVisible();

    act(() => harness.emit({ ...INITIAL_JOB_STATE, phase: "processing", progress: null, stageLabel: "Preparing locally" }));
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Preparing locally");

    act(() => harness.emit(INITIAL_JOB_STATE));
    expect(screen.queryByRole("button", { name: /cancel conversion/i })).not.toBeInTheDocument();
  });

  test("renders managed downloads, preserves warnings, and disposes replaced results", async () => {
    const user = userEvent.setup();
    const harness = createRunnerHarness();
    render(<ToolWorkspace capability={capability("pdf.merge")} runner={harness.runner} />);

    await user.upload(screen.getByLabelText(/choose files/i), [
      new File(["%PDF"], "source-1.pdf", { type: "application/pdf" }),
      new File(["%PDF"], "source-2.pdf", { type: "application/pdf" }),
    ]);
    await waitFor(() => expect(screen.getByRole("button", { name: /run conversion/i })).toBeEnabled(), { timeout: 30000 });
    await user.click(screen.getByRole("button", { name: /run conversion/i }));

    const download = await screen.findByRole("link", { name: /download output-1.pdf/i });
    expect(download).toHaveAttribute("href", "blob:result-1");
    act(() => harness.emit({
      ...INITIAL_JOB_STATE,
      phase: "success-with-warnings",
      progress: 1,
      stageLabel: "Complete",
      warnings: ["lossy-output"],
      result: filesResult().metadata,
    }));
    expect(screen.getByText(/lossy-output/i)).toBeVisible();

    harness.setResult(filesResult("result-2"));
    await user.click(screen.getByRole("button", { name: /run conversion/i }));
    expect(harness.runner.disposeResult).toHaveBeenCalledWith("result-1");
    expect(await screen.findByRole("link", { name: /download output-1.pdf/i })).toHaveAttribute("href", "blob:result-2");
  });

  test("renders values without download links and clears sensitive passwords on replacement and unmount", async () => {
    const user = userEvent.setup();
    const harness = createRunnerHarness();
    harness.setResult({
      id: "password-1",
      mode: "value",
      value: { kind: "password", value: "LOCAL_PASSWORD_VALUE" },
      metadata: { resultMode: "value", outputMimeTypes: [], outputBytes: [] },
    });
    const view = render(<ToolWorkspace capability={capability("utility.password")} runner={harness.runner} />);

    await user.click(screen.getByRole("button", { name: /run conversion/i }));
    expect(await screen.findByText("LOCAL_PASSWORD_VALUE")).toBeVisible();
    expect(screen.queryByRole("link", { name: /download/i })).not.toBeInTheDocument();

    harness.setResult({
      id: "password-2",
      mode: "value",
      value: { kind: "password", value: "NEXT_LOCAL_PASSWORD" },
      metadata: { resultMode: "value", outputMimeTypes: [], outputBytes: [] },
    });
    await user.click(screen.getByRole("button", { name: /run conversion/i }));
    expect(harness.runner.disposeResult).toHaveBeenCalledWith("password-1");
    expect(screen.queryByText("LOCAL_PASSWORD_VALUE")).not.toBeInTheDocument();
    expect(await screen.findByText("NEXT_LOCAL_PASSWORD")).toBeVisible();

    view.unmount();
    expect(harness.runner.disposeResult).toHaveBeenCalledWith("password-2");
    expect(harness.runner.dispose).toHaveBeenCalledTimes(1);
  });

  test("renders selected-entry download names without raw blobs", async () => {
    const user = userEvent.setup();
    const harness = createRunnerHarness();
    harness.setResult({
      id: "entry-1",
      mode: "selected-entries",
      metadata: { resultMode: "selected-entries", outputMimeTypes: ["application/octet-stream"], outputBytes: [11] },
      outputs: [{ url: "blob:entry-1", mimeType: "application/octet-stream", bytes: 11, downloadName: "report.txt" }],
    });
    render(<ToolWorkspace capability={capability("archive.zip-extract")} runner={harness.runner} />);
    await user.upload(screen.getByLabelText(/choose files/i), new File(["PK"], "input.zip", { type: "application/zip" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /run conversion/i })).toBeEnabled(), { timeout: 30000 });
    await user.click(screen.getByRole("button", { name: /run conversion/i }));
    expect(await screen.findByRole("link", { name: /download report.txt/i })).toHaveAttribute("href", "blob:entry-1");
    expect(document.body.textContent).not.toContain("UNIQUE_RAW_BLOB_MARKER");
  });
});
