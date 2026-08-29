import { describe, expect, test } from "vitest";
import { buildTelemetryEvent } from "./sanitize";

const safeInput = {
  capabilityId: "pdf.merge",
  stage: "failure" as const,
  durationBucket: "1-5s" as const,
  deviceClass: "desktop" as const,
  errorCode: "conversion-failed" as const,
  appVersion: "0.1.0",
  engineVersion: "pdf-lib-1.17.1",
};

describe("buildTelemetryEvent", () => {
  test("drops file-derived and free-form fields", () => {
    const event = buildTelemetryEvent({
      ...safeInput,
      filename: "private.pdf",
      message: "C:\\secret\\private.pdf failed",
      filePath: "C:\\secret\\private.pdf",
      exactBytes: 123_456,
      dimensions: "3840x2160",
      durationSeconds: 98,
      pageCount: 12,
      ocrText: "UNIQUE_OCR_MARKER",
      fileHash: "UNIQUE_HASH_MARKER",
      objectUrl: "blob:UNIQUE_URL_MARKER",
      rawException: "UNIQUE_EXCEPTION_MARKER",
    } as never);

    expect(event).toEqual(safeInput);
    const serialized = JSON.stringify(event);
    for (const marker of [
      "private.pdf",
      "secret",
      "123456",
      "3840x2160",
      "UNIQUE_OCR_MARKER",
      "UNIQUE_HASH_MARKER",
      "UNIQUE_URL_MARKER",
      "UNIQUE_EXCEPTION_MARKER",
    ]) {
      expect(serialized).not.toContain(marker);
    }
  });

  test("drops raw workspace result values", () => {
    const event = buildTelemetryEvent({
      ...safeInput,
      stage: "success",
      errorCode: undefined,
      workspaceState: {
        phase: "success",
        result: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [42] },
      },
      blob: new Blob(["UNIQUE_RAW_BLOB_MARKER"], { type: "application/pdf" }),
      outputUrl: "blob:UNIQUE_OUTPUT_URL",
      downloadName: "UNIQUE_DOWNLOAD_NAME.pdf",
      numberValue: 42,
      timeValue: "2026-08-30T00:00:00Z",
      passwordValue: "UNIQUE_PASSWORD_VALUE",
      colorValue: "#abcdef",
      paletteValue: ["#111111", "#222222"],
    } as never);

    expect(event).toEqual({
      capabilityId: safeInput.capabilityId,
      stage: "success",
      durationBucket: safeInput.durationBucket,
      deviceClass: safeInput.deviceClass,
      appVersion: safeInput.appVersion,
      engineVersion: safeInput.engineVersion,
    });
    const serialized = JSON.stringify(event);
    for (const marker of [
      "UNIQUE_RAW_BLOB_MARKER",
      "UNIQUE_OUTPUT_URL",
      "UNIQUE_DOWNLOAD_NAME",
      "UNIQUE_PASSWORD_VALUE",
      "#abcdef",
      "#111111",
    ]) {
      expect(serialized).not.toContain(marker);
    }
  });

  test("rejects unknown capabilities and closed telemetry values", () => {
    expect(() => buildTelemetryEvent({ ...safeInput, capabilityId: "pdf.unknown" })).toThrow("Unknown capability ID");
    expect(() => buildTelemetryEvent({ ...safeInput, stage: "idle" } as never)).toThrow("Invalid telemetry stage");
    expect(() => buildTelemetryEvent({ ...safeInput, durationBucket: "exactly-37s" } as never)).toThrow("Invalid duration bucket");
    expect(() => buildTelemetryEvent({ ...safeInput, deviceClass: "workstation" } as never)).toThrow("Invalid device class");
    expect(() => buildTelemetryEvent({ ...safeInput, errorCode: "raw-exception" } as never)).toThrow("Invalid error code");
  });
});
