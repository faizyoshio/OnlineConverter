import "client-only";
import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageResizeAdapter(dependencies: ImageAdapterDependencies = {}) {
  return createImageAdapter("image.resize", dependencies);
}

