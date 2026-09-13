import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageWebpToPngAdapter(dependencies?: ImageAdapterDependencies) {
  return createImageAdapter("image.webp-to-png", dependencies);
}

