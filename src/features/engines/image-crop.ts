import "client-only";
import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageCropAdapter(dependencies: ImageAdapterDependencies = {}) {
  return createImageAdapter("image.crop", dependencies);
}

