export type ImageCapabilityId =
  | "image.jpg-to-modern"
  | "image.webp-to-jpg"
  | "image.webp-to-png"
  | "image.jfif-to-png"
  | "image.rotate"
  | "image.flip";

export type ImageCodecCapabilityId = ImageCapabilityId;

export type ImageEncodeOptions = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
  background?: string;
  rotationDegrees?: 90 | 180 | 270;
  flipDirection?: "horizontal" | "vertical";
};

export function parseImageCodecCapabilityId(value: string): ImageCapabilityId {
  if (
    value === "image.jpg-to-modern"
    || value === "image.webp-to-jpg"
    || value === "image.webp-to-png"
    || value === "image.jfif-to-png"
    || value === "image.rotate"
    || value === "image.flip"
  ) return value;
  throw new Error(`Unknown image capability: ${value}`);
}

function percentage(options: Readonly<Record<string, unknown>>, key: string, fallback: number): number {
  const raw = options[key] ?? fallback;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 1 || raw > 100) {
    throw new Error(`${key} must be between 1 and 100`);
  }
  return raw / 100;
}

function color(options: Readonly<Record<string, unknown>>, key: string, fallback: string): string {
  const raw = options[key] ?? fallback;
  if (typeof raw !== "string" || !/^#[0-9a-f]{6}$/i.test(raw)) {
    throw new Error(`${key} must be a six-digit hexadecimal color`);
  }
  return raw;
}

function resolveTargetMime(target: unknown): { mimeType: "image/jpeg" | "image/png" | "image/webp"; quality?: number; background?: string } {
  if (target === "jpeg") {
    return { mimeType: "image/jpeg", quality: 0.85, background: "#ffffff" };
  }
  if (target === "webp") {
    return { mimeType: "image/webp", quality: 0.85 };
  }
  if (target === "png" || target === "bmp" || target === null || target === undefined) {
    return { mimeType: "image/png" };
  }
  throw new Error(`Unsupported target format: ${String(target)}`);
}

function resolveRotation(options: Readonly<Record<string, unknown>>): 90 | 180 | 270 {
  const raw = options.degrees ?? "90";
  const str = String(raw);
  if (str === "90") return 90;
  if (str === "180") return 180;
  if (str === "270") return 270;
  throw new Error("Rotation degrees must be 90, 180, or 270");
}

function resolveFlipDirection(options: Readonly<Record<string, unknown>>): "horizontal" | "vertical" {
  const raw = options.direction ?? "horizontal";
  if (raw === "horizontal" || raw === "vertical") return raw;
  throw new Error("Flip direction must be horizontal or vertical");
}

export function resolveImageEncodeOptions(
  capabilityId: ImageCapabilityId,
  options: Readonly<Record<string, unknown>>,
): ImageEncodeOptions {
  if (capabilityId === "image.jpg-to-modern") {
    if (options.target === "png") return { mimeType: "image/png" };
    if (options.target === "webp") {
      return { mimeType: "image/webp", quality: percentage(options, "webpQuality", 85) };
    }
    throw new Error("JPEG conversion target must be PNG or WebP");
  }
  if (capabilityId === "image.webp-to-jpg") {
    return {
      mimeType: "image/jpeg",
      quality: percentage(options, "quality", 85),
      background: color(options, "alphaBackground", "#ffffff"),
    };
  }
  if (capabilityId === "image.webp-to-png" || capabilityId === "image.jfif-to-png") {
    return { mimeType: "image/png" };
  }
  if (capabilityId === "image.rotate") {
    const target = resolveTargetMime(options.target);
    return {
      ...target,
      rotationDegrees: resolveRotation(options),
    };
  }
  if (capabilityId === "image.flip") {
    const target = resolveTargetMime(options.target);
    return {
      ...target,
      flipDirection: resolveFlipDirection(options),
    };
  }
  throw new Error(`Unknown image capability: ${String(capabilityId)}`);
}
