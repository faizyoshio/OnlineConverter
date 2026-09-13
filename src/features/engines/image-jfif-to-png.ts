import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageJfifToPngAdapter(dependencies?: ImageAdapterDependencies) {
  return createImageAdapter("image.jfif-to-png", dependencies);
}

