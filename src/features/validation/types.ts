import type { CapabilityManifest } from "@/features/capabilities/schema";
import type { FileKind, ProbeRule } from "@/features/capabilities/schema";

export type SignatureDetection = {
  kind: FileKind | "unknown";
  probeRule: ProbeRule | "unknown";
  confidence: "exact" | "candidate" | "none";
};

export type FileProbe = {
  kind: FileKind | "unknown";
  probeRule: ProbeRule | "unknown";
  bytes: number;
  pages?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  frames?: number;
  expandedBytes?: number;
  archiveEntries?: number;
  archiveDepth?: number;
};

export type ValidationIssue = {
  code: "unsupported-format" | "limit-exceeded" | "malformed-input" | "device-capability";
  field: string;
  measured?: number;
  limit?: number;
  message: string;
};

export interface ProbeAndValidateAdapter<
  TOptions extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> {
  probe(input: File): Promise<FileProbe>;
  validate(inputs: readonly File[], options: TOptions): Promise<readonly ValidationIssue[]>;
}

export interface CapabilityValidator {
  validateCheap(
    capability: CapabilityManifest,
    files: readonly File[],
    options: Readonly<Record<string, unknown>>,
  ): Promise<readonly ValidationIssue[]>;
  validateWithAdapter(
    capability: CapabilityManifest,
    files: readonly File[],
    options: Readonly<Record<string, unknown>>,
    adapter: ProbeAndValidateAdapter<Readonly<Record<string, unknown>>>,
  ): Promise<readonly ValidationIssue[]>;
}
