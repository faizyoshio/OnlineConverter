/**
 * Browser-first Utility operations: unit conversion, time conversion, password generation, and ZIP archive handling.
 */

import "client-only";
import JSZip from "jszip";

// Unit conversion tables (base unit in SI)
const UNIT_FACTORS: Record<string, Record<string, number>> = {
  length: {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    in: 0.0254,
    ft: 0.3048,
    yd: 0.9144,
    mi: 1609.344,
  },
  mass: {
    kg: 1,
    g: 0.001,
    mg: 0.000001,
    lb: 0.45359237,
    oz: 0.028349523125,
    t: 1000,
  },
  temperature: {
    // Special handling for temperature
    c: 1,
    f: 1,
    k: 1,
  },
  area: {
    sqm: 1,
    sqkm: 1000000,
    sqft: 0.09290304,
    sqin: 0.00064516,
    ac: 4046.8564224,
    ha: 10000,
  },
  volume: {
    l: 1,
    ml: 0.001,
    cum: 1000,
    gal: 3.785411784,
    qt: 0.946352946,
    pt: 0.473176473,
    cup: 0.2365882365,
    floz: 0.0295735295625,
  },
  speed: {
    mps: 1,
    kmh: 0.2777777777777778,
    mph: 0.44704,
    knot: 0.5144444444444445,
  },
  data: {
    b: 1,
    kb: 1000,
    mb: 1000000,
    gb: 1000000000,
    tb: 1000000000000,
    kib: 1024,
    mib: 1048576,
    gib: 1073741824,
    tib: 1099511627776,
  },
};

export function convertUnits(
  value: number,
  category: string,
  fromUnit: string,
  toUnit: string,
  maxSignificantDigits: number = 8,
): { numericValue: number; display: string; unit: string } {
  const fromLower = fromUnit.toLowerCase();
  const toLower = toUnit.toLowerCase();

  let baseValue: number;

  if (category === "temperature") {
    // Convert to Celsius first
    if (fromLower === "c") baseValue = value;
    else if (fromLower === "f") baseValue = ((value - 32) * 5) / 9;
    else if (fromLower === "k") baseValue = value - 273.15;
    else throw new Error(`Unsupported temperature unit: ${fromUnit}`);

    // Convert from Celsius to target
    let result: number;
    if (toLower === "c") result = baseValue;
    else if (toLower === "f") result = (baseValue * 9) / 5 + 32;
    else if (toLower === "k") result = baseValue + 273.15;
    else throw new Error(`Unsupported temperature unit: ${toUnit}`);

    const rounded = Number(result.toPrecision(maxSignificantDigits));
    return { numericValue: rounded, display: `${rounded} ${toUnit}`, unit: toUnit };
  }

  const table = UNIT_FACTORS[category];
  if (!table) throw new Error(`Unsupported unit category: ${category}`);

  const fromFactor = table[fromLower];
  const toFactor = table[toLower];

  if (fromFactor === undefined) throw new Error(`Unsupported unit: ${fromUnit}`);
  if (toFactor === undefined) throw new Error(`Unsupported unit: ${toUnit}`);

  baseValue = value * fromFactor;
  const result = baseValue / toFactor;
  const rounded = Number(result.toPrecision(maxSignificantDigits));

  return { numericValue: rounded, display: `${rounded} ${toUnit}`, unit: toUnit };
}

export function convertTime(
  dateTimeString: string,
  fromZone: string,
  toZone: string,
): { display: string; iso: string; zone: string; utcOffset: string } {
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date/time string");
  }

  const targetZone = toZone === "UTC" || toZone === "local" ? toZone : toZone;
  const timeZoneOption = targetZone === "local" ? undefined : targetZone;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZoneOption,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "shortOffset",
  });

  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "UTC";
  const display = formatter.format(date);
  const iso = date.toISOString();

  return {
    display,
    iso,
    zone: timeZoneOption ?? "local",
    utcOffset: offsetPart,
  };
}

export function generatePassword(options: {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  digits?: boolean;
  symbols?: boolean;
  excludeAmbiguous?: boolean;
}): string {
  const length = options.length ?? 20;
  const useUpper = options.uppercase ?? true;
  const useLower = options.lowercase ?? true;
  const useDigits = options.digits ?? true;
  const useSymbols = options.symbols ?? true;
  const excludeAmbiguous = options.excludeAmbiguous ?? true;

  let upperChars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // without I, O by default if ambiguous
  let lowerChars = "abcdefghijkmnopqrstuvwxyz"; // without l if ambiguous
  let digitChars = "23456789"; // without 0, 1 if ambiguous
  const symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (!excludeAmbiguous) {
    upperChars += "IO";
    lowerChars += "l";
    digitChars += "01";
  }

  let charset = "";
  if (useUpper) charset += upperChars;
  if (useLower) charset += lowerChars;
  if (useDigits) charset += digitChars;
  if (useSymbols) charset += symbolChars;

  if (charset.length === 0) charset = lowerChars;

  const randomValues = new Uint32Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i]! % charset.length];
  }

  return result;
}

export async function createZip(
  files: readonly { name: string; bytes: Uint8Array }[],
  options: { deflateLevel?: number } = {},
): Promise<Uint8Array> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.name, new Blob([Uint8Array.from(file.bytes)]));
  }

  const compressionOptions = {
    type: "uint8array" as const,
    compression: "DEFLATE" as const,
    compressionOptions: {
      level: options.deflateLevel ?? 6,
    },
  };

  return zip.generateAsync(compressionOptions);
}

export async function extractZip(
  zipBytes: Uint8Array,
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const zip = await JSZip.loadAsync(zipBytes);
  const results: { name: string; bytes: Uint8Array }[] = [];

  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (!zipEntry.dir) {
      const bytes = await zipEntry.async("uint8array");
      results.push({ name: filename, bytes });
    }
  }

  return results;
}




