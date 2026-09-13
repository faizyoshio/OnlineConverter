import { createImageAdapter, type ImageAdapterDependencies } from "./image/adapter";

export function createImageJpgToWebpAdapter(dependencies?: ImageAdapterDependencies) {
  return createImageAdapter("image.jpg-to-modern", dependencies);
}

