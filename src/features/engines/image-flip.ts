import "client-only";
import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageFlipAdapter(dependencies: ImageAdapterDependencies = {}) {
  return createImageAdapter("image.flip", dependencies);
}

