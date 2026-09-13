import "client-only";
import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageRotateAdapter(dependencies: ImageAdapterDependencies = {}) {
  return createImageAdapter("image.rotate", dependencies);
}

