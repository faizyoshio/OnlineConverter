export type ImageCapabilityId =
  | "image.jpg-to-modern"
  | "image.webp-to-jpg"
  | "image.webp-to-png"
  | "image.jfif-to-png"
  | "image.rotate"
  | "image.flip"
  | "image.compress"
  | "image.compress-jpg"
  | "image.compress-png"
  | "image.compress-jpeg"
  | "image.compress-webp"
  | "image.compress-heic"
  | "image.compress-bmp"
  | "image.to-jpg"
  | "image.to-png"
  | "image.to-jpeg"
  | "image.to-webp"
  | "image.heic-to-jpg"
  | "image.resize"
  | "image.crop"
  | "image.circle-crop";

export type ImageCodecCapabilityId = ImageCapabilityId;

export type ImageEncodeOptions = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  quality?: number | undefined;
  maxFileSizeKb?: number | undefined;
  background?: string | undefined;
  rotationDegrees?: 90 | 180 | 270 | undefined;
  flipDirection?: "horizontal" | "vertical" | undefined;
  resizeDimensions?: { width?: number | undefined; height?: number | undefined; aspectLock?: boolean | undefined } | undefined;
  cropBox?: { x: number; y: number; width: number; height: number } | undefined;
  circleCrop?: boolean | undefined;
};

export function parseImageCodecCapabilityId(value: string): ImageCapabilityId {
  if (
    value === "image.jpg-to-modern"
    || value === "image.webp-to-jpg"
    || value === "image.webp-to-png"
    || value === "image.jfif-to-png"
    || value === "image.rotate"
    || value === "image.flip"
    || value === "image.compress"
    || value === "image.compress-jpg"
    || value === "image.compress-png"
    || value === "image.compress-jpeg"
    || value === "image.compress-webp"
    || value === "image.compress-heic"
    || value === "image.compress-bmp"
    || value === "image.to-jpg"
    || value === "image.to-png"
    || value === "image.to-jpeg"
    || value === "image.to-webp"
    || value === "image.heic-to-jpg"
    || value === "image.resize"
    || value === "image.crop"
    || value === "image.circle-crop"
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
function targetFileSize(options: Readonly<Record<string, unknown>>): number {
  const raw = options.maxFileSizeKb ?? 500;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 1 || raw > 50000) {
    throw new Error("maxFileSizeKb must be between 1 and 50000");
  }
  return raw;
}

  if (capabilityId === "image.compress") {
    return { mimeType: "image/jpeg", quality: 0.8 };
  }
  if (capabilityId === "image.compress-jpg" || capabilityId === "image.compress-jpeg") {
    const isMaxFileSize = options.compressionMode === "maxFileSize";
    return {
      mimeType: "image/jpeg",
      quality: isMaxFileSize ? undefined : percentage(options, "quality", 75),
      maxFileSizeKb: isMaxFileSize ? targetFileSize(options) : undefined,
    };
  }
  if (capabilityId === "image.compress-png") {
    return { mimeType: "image/png" };
  }
  if (capabilityId === "image.compress-webp") {
    const isMaxFileSize = options.compressionMode === "maxFileSize";
    return {
      mimeType: "image/webp",
      quality: isMaxFileSize ? undefined : percentage(options, "quality", 75),
      maxFileSizeKb: isMaxFileSize ? targetFileSize(options) : undefined,
    };
  }
  if (capabilityId === "image.compress-heic" || capabilityId === "image.heic-to-jpg") {
    return { mimeType: "image/jpeg", quality: percentage(options, "quality", 85) };
  }
  if (capabilityId === "image.compress-bmp") {
    return { mimeType: "image/png" };
  }
  if (capabilityId === "image.to-jpg" || capabilityId === "image.to-jpeg") {
    return {
      mimeType: "image/jpeg",
      quality: percentage(options, "quality", 85),
      background: color(options, "alphaBackground", "#ffffff"),
    };
  }
  if (capabilityId === "image.to-png") {
    return { mimeType: "image/png" };
  }
  if (capabilityId === "image.to-webp") {
    return { mimeType: "image/webp", quality: percentage(options, "quality", 85) };
  }
  if (capabilityId === "image.resize") {
    const target = resolveTargetMime(options.target);
    const width = typeof options.width === "number" && Number.isFinite(options.width) && options.width > 0 ? options.width : undefined;
    const height = typeof options.height === "number" && Number.isFinite(options.height) && options.height > 0 ? options.height : undefined;
    const aspectLock = options.aspectLock !== false;
    return {
      ...target,
      resizeDimensions: { width, height, aspectLock },
    };
  }
  if (capabilityId === "image.crop") {
    const target = resolveTargetMime(options.target);
    let cropBox: { x: number; y: number; width: number; height: number } | undefined;
    if (typeof options.cropBox === "string") {
      const parts = options.cropBox.split(",").map((part) => Number(part.trim()));
      if (
        parts.length === 4
        && parts.every((n) => Number.isFinite(n) && n >= 0)
        && parts[2]! > 0
        && parts[3]! > 0
      ) {
        cropBox = { x: parts[0]!, y: parts[1]!, width: parts[2]!, height: parts[3]! };
      }
    } else if (options.cropBox && typeof options.cropBox === "object") {
      const box = options.cropBox as Record<string, unknown>;
      if (
        typeof box.x === "number"
        && typeof box.y === "number"
        && typeof box.width === "number"
        && typeof box.height === "number"
        && box.width > 0
        && box.height > 0
      ) {
        cropBox = { x: box.x, y: box.y, width: box.width, height: box.height };
      }
    }
    return {
      ...target,
      cropBox,
    };
  }
  if (capabilityId === "image.circle-crop") {
    const mimeType = options.target === "webp" ? "image/webp" : "image/png";
    return {
      mimeType,
      circleCrop: true,
    };
  }
  throw new Error(`Unknown image capability: ${String(capabilityId)}`);
}
