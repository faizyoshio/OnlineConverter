import "client-only";
import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageCompressWebpAdapter(dependencies: ImageAdapterDependencies = {}) {
  return createImageAdapter("image.compress-webp", dependencies);
}

