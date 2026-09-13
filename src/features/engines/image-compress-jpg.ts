import "client-only";
import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageCompressJpgAdapter(dependencies: ImageAdapterDependencies = {}) {
  return createImageAdapter("image.compress-jpeg", dependencies);
}

