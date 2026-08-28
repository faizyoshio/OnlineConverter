function ascii(value: string): number[] {
  return Array.from(value, (character) => character.charCodeAt(0));
}

function isoBmff(brand: string): Uint8Array {
  return new Uint8Array([0, 0, 0, 24, ...ascii("ftyp"), ...ascii(brand)]);
}

function riff(kind: string): Uint8Array {
  return new Uint8Array([...ascii("RIFF"), 0, 0, 0, 0, ...ascii(kind)]);
}

export const HEADERS = Object.freeze({
  pdf: new Uint8Array(ascii("%PDF-1.7")),
  jpeg: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
  png: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  bmp: new Uint8Array(ascii("BM")),
  webp: new Uint8Array([...riff("WEBP")]),
  gif87: new Uint8Array(ascii("GIF87a")),
  gif89: new Uint8Array(ascii("GIF89a")),
  zip: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
  heic: isoBmff("heic"),
  mp4: isoBmff("isom"),
  mov: isoBmff("qt  "),
  m4a: isoBmff("M4A "),
  webm: new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]),
  avi: riff("AVI "),
  wav: riff("WAVE"),
  mp3Id3: new Uint8Array(ascii("ID3")),
  mp3Frame: new Uint8Array([0xff, 0xfb, 0x90, 0x64]),
  ogg: new Uint8Array(ascii("OggS")),
  aac: new Uint8Array([0xff, 0xf1, 0x50, 0x80]),
  flac: new Uint8Array(ascii("fLaC")),
  html: new TextEncoder().encode("<main>safe</main>"),
  svg: new TextEncoder().encode("<svg viewBox='0 0 1 1'></svg>"),
  text: new TextEncoder().encode("plain text"),
});
