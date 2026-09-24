/** Browser-first utility operations with no server-side data path. */

import "client-only";
import JSZip from "jszip";
import { UNIVERSAL_LIMITS } from "@/features/validation/limits";

type UnitTable = Readonly<Record<string, number>>;

const UNIT_FACTORS: Readonly<Record<string, UnitTable>> = Object.freeze({
  length: Object.freeze({ m: 1, km: 1_000, cm: 0.01, mm: 0.001, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1_609.344 }),
  area: Object.freeze({ sqm: 1, m2: 1, sqkm: 1_000_000, km2: 1_000_000, sqft: 0.09290304, sqin: 0.00064516, ac: 4_046.8564224, ha: 10_000 }),
  volume: Object.freeze({ l: 1, ml: 0.001, cum: 1_000, m3: 1_000, gal: 3.785411784, qt: 0.946352946, pt: 0.473176473, cup: 0.2365882365, floz: 0.0295735295625 }),
  mass: Object.freeze({ kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125, t: 1_000 }),
  speed: Object.freeze({ mps: 1, kmh: 0.2777777777777778, mph: 0.44704, knot: 0.5144444444444445 }),
  pressure: Object.freeze({ pa: 1, kpa: 1_000, mpa: 1_000_000, bar: 100_000, psi: 6_894.757293168, atm: 101_325, torr: 133.32236842105263 }),
  energy: Object.freeze({ j: 1, kj: 1_000, mj: 1_000_000, wh: 3_600, kwh: 3_600_000, cal: 4.184, kcal: 4_184, btu: 1_055.05585262 }),
  power: Object.freeze({ w: 1, kw: 1_000, mw: 1_000_000, hp: 745.6998715822702 }),
  "data-size": Object.freeze({ b: 1, kb: 1_000, mb: 1_000_000, gb: 1_000_000_000, tb: 1_000_000_000_000, kib: 1_024, mib: 1_048_576, gib: 1_073_741_824, tib: 1_099_511_627_776, bit: 0.125, kbit: 125, mbit: 125_000, gbit: 125_000_000 }),
  angle: Object.freeze({ rad: 1, deg: Math.PI / 180, grad: Math.PI / 200, turn: Math.PI * 2 }),
});

function precision(value: number, maximum: number): number {
  return Number(value.toPrecision(Math.min(8, Math.max(1, Math.trunc(maximum)))));
}

function resultValue(numericValue: number, toUnit: string, maxSignificantDigits: number) {
  return { numericValue, display: `${precision(numericValue, maxSignificantDigits)} ${toUnit}`, unit: toUnit };
}

export function convertUnits(value: number, category: string, fromUnit: string, toUnit: string, maxSignificantDigits = 8): { numericValue: number; display: string; unit: string } {
  if (!Number.isFinite(value)) throw new Error("Unit value must be finite");
  const fromLower = fromUnit.trim().toLowerCase();
  const toLower = toUnit.trim().toLowerCase();
  if (!fromLower || !toLower) throw new Error("Both units are required");

  if (category === "temperature") {
    let celsius: number;
    if (fromLower === "c") celsius = value;
    else if (fromLower === "f") celsius = ((value - 32) * 5) / 9;
    else if (fromLower === "k") celsius = value - 273.15;
    else throw new Error(`Unsupported temperature unit: ${fromUnit}`);
    let converted: number;
    if (toLower === "c") converted = celsius;
    else if (toLower === "f") converted = (celsius * 9) / 5 + 32;
    else if (toLower === "k") converted = celsius + 273.15;
    else throw new Error(`Unsupported temperature unit: ${toUnit}`);
    return resultValue(converted, toUnit, maxSignificantDigits);
  }

  const normalizedCategory = category === "data" ? "data-size" : category;
  const table = UNIT_FACTORS[normalizedCategory];
  if (!table) throw new Error(`Unsupported unit category: ${category}`);
  const fromFactor = table[fromLower];
  const toFactor = table[toLower];
  if (fromFactor === undefined) throw new Error(`Unsupported unit: ${fromUnit}`);
  if (toFactor === undefined) throw new Error(`Unsupported unit: ${toUnit}`);
  return resultValue((value * fromFactor) / toFactor, toUnit, maxSignificantDigits);
}

type WallTime = { year: number; month: number; day: number; hour: number; minute: number; second: number; millisecond: number };
const WALL_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
const EXPLICIT_OFFSET_PATTERN = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

function parseWallTime(value: string): WallTime {
  const match = WALL_TIME_PATTERN.exec(value);
  if (!match) throw new Error("Invalid date/time string");
  const wall: WallTime = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour: Number(match[4]), minute: Number(match[5]), second: Number(match[6] ?? 0), millisecond: Number((match[7] ?? "0").padEnd(3, "0")) };
  const check = new Date(Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second, wall.millisecond));
  if (check.getUTCFullYear() !== wall.year || check.getUTCMonth() + 1 !== wall.month || check.getUTCDate() !== wall.day || check.getUTCHours() !== wall.hour || check.getUTCMinutes() !== wall.minute || check.getUTCSeconds() !== wall.second) {
    throw new Error("Invalid date/time string");
  }
  return wall;
}

function zoneFormatter(timeZone: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  } catch {
    throw new Error(`Invalid time zone: ${timeZone}`);
  }
}

function zonedParts(date: Date, formatter: Intl.DateTimeFormat): Omit<WallTime, "millisecond"> {
  const values = Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  const value = (key: "year" | "month" | "day" | "hour" | "minute" | "second"): number => {
    const part = values[key];
    if (typeof part !== "number" || !Number.isFinite(part)) throw new Error(`Missing date/time part: ${key}`);
    return part;
  };
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

function wallTimeToInstant(wall: WallTime, timeZone: string): Date {
  const formatter = zoneFormatter(timeZone);
  const target = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second, wall.millisecond);
  let candidate = target;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = zonedParts(new Date(candidate), formatter);
    const represented = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second, wall.millisecond);
    const difference = target - represented;
    candidate += difference;
    if (difference === 0) break;
  }
  const resolved = new Date(candidate);
  const roundTrip = zonedParts(resolved, formatter);
  if (roundTrip.year !== wall.year || roundTrip.month !== wall.month || roundTrip.day !== wall.day || roundTrip.hour !== wall.hour || roundTrip.minute !== wall.minute || roundTrip.second !== wall.second) {
    throw new Error(`Invalid or nonexistent wall time in ${timeZone}`);
  }
  return resolved;
}

export function convertTime(dateTimeString: string, fromZone: string, toZone: string): { display: string; iso: string; zone: string; utcOffset: string } {
  const source = dateTimeString.trim();
  let date: Date;
  if (EXPLICIT_OFFSET_PATTERN.test(source)) date = new Date(source);
  else if (fromZone === "local") { parseWallTime(source); date = new Date(source); }
  else date = wallTimeToInstant(parseWallTime(source), fromZone);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date/time string");
  const targetZone = toZone === "local" ? undefined : toZone;
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-US", { timeZone: targetZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZoneName: "shortOffset" });
  } catch {
    throw new Error(`Invalid time zone: ${toZone}`);
  }
  const offset = formatter.formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  return { display: formatter.format(date), iso: date.toISOString(), zone: targetZone ?? "local", utcOffset: /^(?:GMT|UTC)(?:\+0(?::?00)?)?$/.test(offset) ? "GMT" : offset };
}

export type PasswordOptions = { length?: number; uppercase?: boolean; lowercase?: boolean; digits?: boolean; symbols?: boolean; excludeAmbiguous?: boolean };
export type RandomSource = { getRandomValues(array: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> };

function randomIndex(maxExclusive: number, source: RandomSource): number {
  const cutoff = 256 - (256 % maxExclusive);
  const value = new Uint8Array(1);
  do source.getRandomValues(value); while (value[0]! >= cutoff);
  return value[0]! % maxExclusive;
}

export function generatePassword(options: PasswordOptions, randomSource: RandomSource | null | undefined = globalThis.crypto ?? null): string {
  const length = options.length ?? 20;
  if (!Number.isInteger(length) || length < 4 || length > 128) throw new Error("Password length must be between 4 and 128");
  if (!randomSource || typeof randomSource.getRandomValues !== "function") throw new Error("Secure random generation is unavailable");
  const excludeAmbiguous = options.excludeAmbiguous ?? true;
  const groups: string[] = [];
  if (options.uppercase ?? true) groups.push(excludeAmbiguous ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (options.lowercase ?? true) groups.push(excludeAmbiguous ? "abcdefghijkmnopqrstuvwxyz" : "abcdefghijklmnopqrstuvwxyz");
  if (options.digits ?? true) groups.push(excludeAmbiguous ? "23456789" : "0123456789");
  if (options.symbols ?? true) groups.push("!@#$%^&*()_+-=[]{}|;:,.<>?");
  if (groups.length === 0) throw new Error("Select at least one character group");
  if (length < groups.length) throw new Error("Password length is too short for the selected character groups");
  const alphabet = groups.join("");
  const characters = groups.map((group) => group[randomIndex(group.length, randomSource)]!);
  while (characters.length < length) characters.push(alphabet[randomIndex(alphabet.length, randomSource)]!);
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1, randomSource);
    [characters[index], characters[swap]] = [characters[swap]!, characters[index]!];
  }
  return characters.join("");
}

export type ZipEntryData = { name: string; bytes: Uint8Array };
export type ZipSafetyLimits = { maxCompressedBytes?: number; maxExpandedBytes?: number; maxEntries?: number; maxDepth?: number };
export type ZipInspection = { archiveEntries: number; archiveDepth: number; expandedBytes: number };

function archiveLimits(limits: ZipSafetyLimits = {}) {
  return { maxCompressedBytes: limits.maxCompressedBytes ?? UNIVERSAL_LIMITS.zip.compressedBytes, maxExpandedBytes: limits.maxExpandedBytes ?? UNIVERSAL_LIMITS.zip.expandedBytes, maxEntries: limits.maxEntries ?? UNIVERSAL_LIMITS.zip.entries, maxDepth: limits.maxDepth ?? UNIVERSAL_LIMITS.zip.depth };
}

export function normalizeArchiveName(name: string): string {
  if (!name || name.includes("\0") || /^[a-z]:/i.test(name) || /^[\\/]/.test(name)) throw new Error(`Unsafe archive name: ${name}`);
  const normalized = name.replace(/\\/g, "/");
  const segments = normalized.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) throw new Error(`Unsafe archive name: ${name}`);
  return normalized;
}

export async function createZip(files: readonly ZipEntryData[], options: { deflateLevel?: number } = {}): Promise<Uint8Array> {
  if (files.length === 0 || files.length > UNIVERSAL_LIMITS.batch.files) throw new Error(`ZIP creation accepts between 1 and ${UNIVERSAL_LIMITS.batch.files} files`);
  if (files.reduce((total, file) => total + file.bytes.byteLength, 0) > UNIVERSAL_LIMITS.batch.bytes) throw new Error("ZIP input exceeds the aggregate byte limit");
  const level = options.deflateLevel ?? 6;
  if (!Number.isInteger(level) || level < 0 || level > 9) throw new Error("Deflate level must be between 0 and 9");
  const zip = new JSZip();
  const names = new Set<string>();
  for (const file of files) {
    const name = normalizeArchiveName(file.name);
    if (names.has(name)) throw new Error(`Duplicate archive name: ${name}`);
    names.add(name);
    zip.file(name, new Blob([Uint8Array.from(file.bytes)]), { createFolders: true });
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level } });
}

async function readSafeZip(zipBytes: Uint8Array, requestedLimits: ZipSafetyLimits = {}): Promise<{ entries: ZipEntryData[]; inspection: ZipInspection }> {
  const limits = archiveLimits(requestedLimits);
  if (zipBytes.byteLength > limits.maxCompressedBytes) throw new Error("ZIP exceeds the compressed-size limit");
  const zip = await JSZip.loadAsync(zipBytes);
  const objects = Object.values(zip.files).filter((entry) => !entry.dir);
  if (objects.length > limits.maxEntries) throw new Error("ZIP exceeds the entries limit");
  const validated = objects.map((entry) => {
    const name = normalizeArchiveName(entry.unsafeOriginalName ?? entry.name);
    const depth = name.split("/").length;
    if (depth > limits.maxDepth) throw new Error("ZIP exceeds the nesting depth limit");
    return { entry, name, depth };
  });
  const entries: ZipEntryData[] = [];
  let expandedBytes = 0;
  let archiveDepth = 0;
  for (const item of validated) {
    const bytes = await item.entry.async("uint8array");
    expandedBytes += bytes.byteLength;
    if (expandedBytes > limits.maxExpandedBytes) throw new Error("ZIP exceeds the expanded-size limit");
    archiveDepth = Math.max(archiveDepth, item.depth);
    entries.push({ name: item.name, bytes });
  }
  return { entries, inspection: { archiveEntries: entries.length, archiveDepth, expandedBytes } };
}

export async function inspectZip(zipBytes: Uint8Array, limits: ZipSafetyLimits = {}): Promise<ZipInspection> {
  return (await readSafeZip(zipBytes, limits)).inspection;
}

export async function extractZip(zipBytes: Uint8Array, limits: ZipSafetyLimits = {}): Promise<ZipEntryData[]> {
  return (await readSafeZip(zipBytes, limits)).entries;
}
