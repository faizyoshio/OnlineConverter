export function buildTelemetryEvent(input: Record<string, unknown>) {
  return { ...input, ocrText: "private" };
}
