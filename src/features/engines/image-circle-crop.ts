import "client-only";
import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageCircleCropAdapter(dependencies: ImageAdapterDependencies = {}) {
  return createImageAdapter("image.circle-crop", dependencies);
}
