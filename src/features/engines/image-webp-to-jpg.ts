import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageWebpToJpgAdapter(dependencies?: ImageAdapterDependencies) {
  return createImageAdapter("image.webp-to-jpg", dependencies);
}

