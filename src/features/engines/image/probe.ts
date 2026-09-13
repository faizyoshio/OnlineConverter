import { detectSignature } from "@/features/validation/signatures";
import type { FileProbe } from "@/features/validation/types";

export type RasterImageDecoder = (input: File) => Promise<ImageBitmap>;

function unknownProbe(): FileProbe {
  return { kind: "unknown", probeRule: "unknown", bytes: 0 };
}

export async function probeRasterImage(
  file: File,
  decode: RasterImageDecoder = (input) => createImageBitmap(input),
): Promise<FileProbe> {
  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const signature = detectSignature(head);
  if (signature.confidence !== "exact" || (signature.kind !== "jpeg" && signature.kind !== "webp")) {
    return unknownProbe();
  }

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await decode(file);
    const { width, height } = bitmap;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      return unknownProbe();
    }
    return {
      kind: signature.kind,
      probeRule: signature.probeRule,
      bytes: file.size,
      width,
      height,
    };
  } catch {
    return unknownProbe();
  } finally {
    bitmap?.close();
  }
}
