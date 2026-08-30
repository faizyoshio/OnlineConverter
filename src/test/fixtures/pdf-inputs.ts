export const VALID_PNG_BYTES = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 4, 0, 0, 0, 181, 28, 12, 2,
  0, 0, 0, 11, 73, 68, 65, 84, 120, 218, 99, 100, 248, 15, 0, 1,
  5, 1, 1, 39, 24, 227, 102, 0, 0, 0, 0, 73, 69, 78, 68, 174,
  66, 96, 130,
]);

export const VALID_HEIC_BRAND_BYTES = new Uint8Array([
  0, 0, 0, 24,
  0x66, 0x74, 0x79, 0x70,
  0x68, 0x65, 0x69, 0x63,
  0, 0, 0, 0,
  0x68, 0x65, 0x69, 0x63,
  0x6d, 0x69, 0x66, 0x31,
]);

function fileFromBytes(bytes: Uint8Array, name: string, type: string): File {
  return new File([Uint8Array.from(bytes).buffer], name, { type });
}

export function createValidPngFile(name = "fixture.png"): File {
  return fileFromBytes(VALID_PNG_BYTES, name, "image/png");
}

export function createHeicBrandFile(name = "fixture.heic"): File {
  return fileFromBytes(VALID_HEIC_BRAND_BYTES, name, "image/heic");
}

export function createUtf8TextFile(name = "fixture.txt"): File {
  return fileFromBytes(new TextEncoder().encode("Local UTF-8 text fixture."), name, "text/plain");
}

export function createSafeHtmlFile(name = "fixture.html"): File {
  return fileFromBytes(
    new TextEncoder().encode("<main><h1>Local fixture</h1><p>Safe representative text.</p></main>"),
    name,
    "text/html",
  );
}
