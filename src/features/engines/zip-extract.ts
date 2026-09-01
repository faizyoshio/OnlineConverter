import { createArchiveAdapter } from "./archive/adapter";

export function createZipExtractAdapter() {
  return createArchiveAdapter("archive.zip-extract");
}

