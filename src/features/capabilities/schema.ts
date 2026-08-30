import { z } from "zod";

export const capabilityCategorySchema = z.enum(["pdf", "image", "media", "gif", "utility", "trust"]);
export const resultContractSchema = z.enum(["exact-structural", "lossy-visual", "best-effort-semantic"]);
export const releaseStatusSchema = z.enum(["planned", "active", "disabled"]);
const optionValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const optionFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
  label: z.string().min(2).max(64),
  control: z.enum(["select", "number", "range", "toggle", "text", "color", "page-range", "crop-box"]),
  defaultValue: optionValueSchema,
  required: z.boolean(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  step: z.number().positive().optional(),
  choices: z.array(z.object({ label: z.string(), value: optionValueSchema })).optional(),
});
const fixturePlanSchema = z.object({
  minimumValid: z.string().min(3),
  representative: z.string().min(3),
  malformed: z.string().min(3),
  atLimit: z.string().min(3),
  overLimit: z.string().min(3),
  cancellation: z.string().min(3),
  cleanup: z.string().min(3),
});
export const fileKindSchema = z.enum([
  "pdf", "jpeg", "png", "webp", "bmp", "jfif", "heic", "svg", "html", "text",
  "gif", "apng", "zip", "mp4", "mov", "webm", "avi", "mp3", "wav", "ogg",
  "aac", "m4a", "flac", "binary",
]);
export const probeRuleSchema = z.enum([
  "pdf-header", "jpeg-soi", "png-signature", "webp-riff", "bmp-header", "heic-brand",
  "sanitized-svg", "sanitized-html", "utf8-text", "gif-header", "apng-chunks", "zip-header",
  "iso-bmff-brand", "webm-ebml", "avi-riff", "mp3-frame-or-id3", "wav-riff", "ogg-header",
  "aac-adts", "flac-header", "opaque-local-file",
]);
const inputDescriptorSchema = z.object({
  kind: fileKindSchema,
  mimeTypes: z.array(z.string().min(3)).min(1),
  extensions: z.array(z.string().regex(/^(\.[a-z0-9]+|\*)$/)).min(1),
  probeRule: probeRuleSchema,
});
const outputDescriptorSchema = z.object({
  kind: fileKindSchema,
  mimeType: z.string().min(3),
  extension: z.union([z.string().regex(/^\.[a-z0-9]+$/), z.literal("preserve")]),
  fallback: z.enum(["reject", "explicit-user-choice", "listed-fallback"]),
  fallbackKind: fileKindSchema.optional(),
});
const resultDefinitionSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("files"), files: z.array(outputDescriptorSchema).min(1) }),
  z.object({ mode: z.literal("selected-entries"), files: z.array(outputDescriptorSchema).min(1) }),
  z.object({
    mode: z.literal("value"),
    value: z.object({
      kind: z.enum(["number", "text", "time", "color", "palette", "password"]),
      copyable: z.boolean(),
      sensitive: z.boolean(),
    }),
  }),
]);
const limitContractSchema = z.object({
  profiles: z.array(z.enum(["pdf", "image", "batch", "video", "audio", "gif", "zip", "ocr", "utility"])).min(1),
  minimumFiles: z.number().int().nonnegative(),
  maximumFiles: z.number().int().nonnegative(),
  allowMixedKinds: z.boolean(),
});
const browserRequirementSchema = z.enum(["worker", "wasm", "canvas", "offscreen-canvas", "camera", "web-crypto"]);

export const capabilityManifestSchema = z.object({
  id: z.string().regex(/^[a-z]+\.[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2).max(64),
  description: z.string().min(20).max(180),
  category: capabilityCategorySchema,
  aliases: z.array(z.string().min(2).max(48)).max(12),
  execution: z.literal("browser-worker"),
  workerFamily: z.enum(["pdf", "image", "media", "archive", "ocr", "utility"]),
  adapterKey: z.string().regex(/^[a-z]+\.[a-z0-9-]+$/),
  resultContract: resultContractSchema,
  releaseStatus: releaseStatusSchema,
  inputMode: z.enum(["files", "files-or-blank", "camera-or-files", "values"]),
  inputs: z.array(inputDescriptorSchema),
  result: resultDefinitionSchema,
  optionFields: z.array(optionFieldSchema).min(1),
  limits: limitContractSchema,
  warningCodes: z.array(z.string().regex(/^[a-z0-9-]+$/)),
  unsupportedCodes: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1),
  unsupportedMessage: z.string().min(20).max(180),
  browserRequirements: z.array(browserRequirementSchema).min(1),
  fixturePlan: fixturePlanSchema,
}).superRefine((manifest, context) => {
  const fileMode = manifest.inputMode !== "values";
  if (fileMode && manifest.inputs.length === 0) {
    context.addIssue({ code: "custom", path: ["inputs"], message: "File input mode requires a descriptor" });
  }
  if (!fileMode && manifest.inputs.length !== 0) {
    context.addIssue({ code: "custom", path: ["inputs"], message: "Value input mode cannot declare file descriptors" });
  }
  if (manifest.limits.minimumFiles > manifest.limits.maximumFiles) {
    context.addIssue({ code: "custom", path: ["limits"], message: "Minimum files exceeds maximum files" });
  }
});

export type CapabilityManifest = z.infer<typeof capabilityManifestSchema>;
export type CapabilityManifestInput = z.input<typeof capabilityManifestSchema>;
export type CapabilityId = CapabilityManifest["id"];
export type CapabilityCategory = z.infer<typeof capabilityCategorySchema>;
export type FileKind = z.infer<typeof fileKindSchema>;
export type ProbeRule = z.infer<typeof probeRuleSchema>;
export type InputDescriptor = z.infer<typeof inputDescriptorSchema>;
export type OutputDescriptor = z.infer<typeof outputDescriptorSchema>;
export type OptionField = z.infer<typeof optionFieldSchema>;
export type ResultDefinition = z.infer<typeof resultDefinitionSchema>;
export type LimitContract = z.infer<typeof limitContractSchema>;
export type BrowserRequirement = z.infer<typeof browserRequirementSchema>;

const inputDescriptors: Record<FileKind, InputDescriptor> = {
  pdf: { kind: "pdf", mimeTypes: ["application/pdf"], extensions: [".pdf"], probeRule: "pdf-header" },
  jpeg: { kind: "jpeg", mimeTypes: ["image/jpeg"], extensions: [".jpg", ".jpeg"], probeRule: "jpeg-soi" },
  png: { kind: "png", mimeTypes: ["image/png"], extensions: [".png"], probeRule: "png-signature" },
  webp: { kind: "webp", mimeTypes: ["image/webp"], extensions: [".webp"], probeRule: "webp-riff" },
  bmp: { kind: "bmp", mimeTypes: ["image/bmp"], extensions: [".bmp"], probeRule: "bmp-header" },
  jfif: { kind: "jfif", mimeTypes: ["image/jpeg"], extensions: [".jfif", ".jfi", ".jif"], probeRule: "jpeg-soi" },
  heic: { kind: "heic", mimeTypes: ["image/heic", "image/heif"], extensions: [".heic", ".heif"], probeRule: "heic-brand" },
  svg: { kind: "svg", mimeTypes: ["image/svg+xml"], extensions: [".svg"], probeRule: "sanitized-svg" },
  html: { kind: "html", mimeTypes: ["text/html"], extensions: [".html", ".htm"], probeRule: "sanitized-html" },
  text: { kind: "text", mimeTypes: ["text/plain"], extensions: [".txt"], probeRule: "utf8-text" },
  gif: { kind: "gif", mimeTypes: ["image/gif"], extensions: [".gif"], probeRule: "gif-header" },
  apng: { kind: "apng", mimeTypes: ["image/apng", "image/png"], extensions: [".apng", ".png"], probeRule: "apng-chunks" },
  zip: { kind: "zip", mimeTypes: ["application/zip", "application/x-zip-compressed"], extensions: [".zip"], probeRule: "zip-header" },
  mp4: { kind: "mp4", mimeTypes: ["video/mp4"], extensions: [".mp4"], probeRule: "iso-bmff-brand" },
  mov: { kind: "mov", mimeTypes: ["video/quicktime"], extensions: [".mov"], probeRule: "iso-bmff-brand" },
  webm: { kind: "webm", mimeTypes: ["video/webm"], extensions: [".webm"], probeRule: "webm-ebml" },
  avi: { kind: "avi", mimeTypes: ["video/x-msvideo"], extensions: [".avi"], probeRule: "avi-riff" },
  mp3: { kind: "mp3", mimeTypes: ["audio/mpeg"], extensions: [".mp3"], probeRule: "mp3-frame-or-id3" },
  wav: { kind: "wav", mimeTypes: ["audio/wav", "audio/x-wav"], extensions: [".wav"], probeRule: "wav-riff" },
  ogg: { kind: "ogg", mimeTypes: ["audio/ogg"], extensions: [".ogg"], probeRule: "ogg-header" },
  aac: { kind: "aac", mimeTypes: ["audio/aac"], extensions: [".aac"], probeRule: "aac-adts" },
  m4a: { kind: "m4a", mimeTypes: ["audio/mp4", "audio/x-m4a"], extensions: [".m4a"], probeRule: "iso-bmff-brand" },
  flac: { kind: "flac", mimeTypes: ["audio/flac"], extensions: [".flac"], probeRule: "flac-header" },
  binary: { kind: "binary", mimeTypes: ["application/octet-stream"], extensions: ["*"], probeRule: "opaque-local-file" },
};

const outputMetadata: Record<FileKind, { mimeType: string; extension: OutputDescriptor["extension"] }> = {
  pdf: { mimeType: "application/pdf", extension: ".pdf" },
  jpeg: { mimeType: "image/jpeg", extension: ".jpg" },
  png: { mimeType: "image/png", extension: ".png" },
  webp: { mimeType: "image/webp", extension: ".webp" },
  bmp: { mimeType: "image/bmp", extension: ".bmp" },
  jfif: { mimeType: "image/jpeg", extension: ".jfif" },
  heic: { mimeType: "image/heic", extension: ".heic" },
  svg: { mimeType: "image/svg+xml", extension: ".svg" },
  html: { mimeType: "text/html", extension: ".html" },
  text: { mimeType: "text/plain", extension: ".txt" },
  gif: { mimeType: "image/gif", extension: ".gif" },
  apng: { mimeType: "image/apng", extension: ".apng" },
  zip: { mimeType: "application/zip", extension: ".zip" },
  mp4: { mimeType: "video/mp4", extension: ".mp4" },
  mov: { mimeType: "video/quicktime", extension: ".mov" },
  webm: { mimeType: "video/webm", extension: ".webm" },
  avi: { mimeType: "video/x-msvideo", extension: ".avi" },
  mp3: { mimeType: "audio/mpeg", extension: ".mp3" },
  wav: { mimeType: "audio/wav", extension: ".wav" },
  ogg: { mimeType: "audio/ogg", extension: ".ogg" },
  aac: { mimeType: "audio/aac", extension: ".aac" },
  m4a: { mimeType: "audio/mp4", extension: ".m4a" },
  flac: { mimeType: "audio/flac", extension: ".flac" },
  binary: { mimeType: "application/octet-stream", extension: "preserve" },
};

export function input(kind: FileKind): InputDescriptor {
  const descriptor = inputDescriptors[kind];
  return { ...descriptor, mimeTypes: [...descriptor.mimeTypes], extensions: [...descriptor.extensions] };
}

export function output(
  kind: FileKind,
  fallback: OutputDescriptor["fallback"] = "reject",
  fallbackKind?: FileKind,
): OutputDescriptor {
  return { kind, ...outputMetadata[kind], fallback, ...(fallbackKind ? { fallbackKind } : {}) };
}

export function filesResult(...files: OutputDescriptor[]): ResultDefinition {
  return { mode: "files", files };
}

export function selectedEntriesResult(...files: OutputDescriptor[]): ResultDefinition {
  return { mode: "selected-entries", files };
}

export function valueResult(
  kind: Extract<ResultDefinition, { mode: "value" }>["value"]["kind"],
  copyable = true,
  sensitive = false,
): ResultDefinition {
  return { mode: "value", value: { kind, copyable, sensitive } };
}

export function limits(
  profiles: LimitContract["profiles"],
  minimumFiles: number,
  maximumFiles: number,
  allowMixedKinds = false,
): LimitContract {
  return { profiles, minimumFiles, maximumFiles, allowMixedKinds };
}

export function selectOption(
  key: string,
  label: string,
  defaultValue: string | null,
  values: readonly string[],
  required = true,
): OptionField {
  return { key, label, control: "select", defaultValue, required, choices: values.map((value) => ({ label: value, value })) };
}

export function numberOption(
  key: string,
  label: string,
  defaultValue: number,
  minimum: number,
  maximum: number,
  step = 1,
): OptionField {
  return { key, label, control: "number", defaultValue, required: true, minimum, maximum, step };
}

export function rangeOption(
  key: string,
  label: string,
  defaultValue: number,
  minimum: number,
  maximum: number,
  step = 1,
): OptionField {
  return { key, label, control: "range", defaultValue, required: true, minimum, maximum, step };
}

export function toggleOption(key: string, label: string, defaultValue: boolean): OptionField {
  return { key, label, control: "toggle", defaultValue, required: true };
}

export function textOption(key: string, label: string, defaultValue: string | null, required = true): OptionField {
  return { key, label, control: "text", defaultValue, required };
}

export function pageRangeOption(key: string, label: string, defaultValue: string | null): OptionField {
  return { key, label, control: "page-range", defaultValue, required: true };
}

export function cropBoxOption(key: string, label: string, defaultValue: string | null): OptionField {
  return { key, label, control: "crop-box", defaultValue, required: true };
}

export function colorOption(key: string, label: string, defaultValue: string): OptionField {
  return { key, label, control: "color", defaultValue, required: true };
}

type CommonManifestFields =
  | "aliases" | "execution" | "adapterKey" | "releaseStatus" | "warningCodes"
  | "unsupportedCodes" | "unsupportedMessage" | "browserRequirements" | "fixturePlan";

export type CapabilityDefinition = Omit<CapabilityManifestInput, CommonManifestFields> &
  Partial<Pick<CapabilityManifestInput, "aliases" | "releaseStatus" | "warningCodes" | "unsupportedCodes" | "unsupportedMessage">> & {
    browserRequirements?: readonly Exclude<BrowserRequirement, "worker">[];
  };

export function capability(definition: CapabilityDefinition): CapabilityManifestInput {
  const fixturePrefix = definition.id;
  return {
    ...definition,
    aliases: definition.aliases ?? [],
    execution: "browser-worker",
    adapterKey: definition.id,
    releaseStatus: definition.releaseStatus ?? "planned",
    warningCodes: definition.warningCodes ?? [],
    unsupportedCodes: definition.unsupportedCodes ?? ["browser-worker-unavailable"],
    unsupportedMessage: definition.unsupportedMessage ??
      "This tool is not supported in this browser because required local processing features are unavailable.",
    browserRequirements: ["worker", ...(definition.browserRequirements ?? [])],
    fixturePlan: {
      minimumValid: fixturePrefix + "/minimum-valid",
      representative: fixturePrefix + "/representative",
      malformed: fixturePrefix + "/malformed",
      atLimit: fixturePrefix + "/at-limit",
      overLimit: fixturePrefix + "/over-limit",
      cancellation: fixturePrefix + "/cancellation",
      cleanup: fixturePrefix + "/cleanup",
    },
  };
}
