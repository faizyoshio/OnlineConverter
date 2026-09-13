import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageJpgToPngAdapter(dependencies?: ImageAdapterDependencies) {
  return createImageAdapter("image.jpg-to-modern", dependencies);
}

