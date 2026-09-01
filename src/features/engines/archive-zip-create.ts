import { createArchiveAdapter } from "./archive/adapter";

export function createArchiveZipCreateAdapter() {
  return createArchiveAdapter("archive.zip-create");
}

