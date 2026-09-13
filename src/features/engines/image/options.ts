export type ImageCodecCapabilityId =
  | "image.jpg-to-modern"
  | "image.webp-to-jpg"
  | "image.webp-to-png"
  | "image.jfif-to-png";

export type ImageEncodeOptions = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
  background?: string;
};

export function parseImageCodecCapabilityId(value: string): ImageCodecCapabilityId {
  if (
    value === "image.jpg-to-modern"
    || value === "image.webp-to-jpg"
    || value === "image.webp-to-png"
    || value === "image.jfif-to-png"
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

export function resolveImageEncodeOptions(
  capabilityId: ImageCodecCapabilityId,
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
  throw new Error(`Unknown image capability: ${String(capabilityId)}`);
}
