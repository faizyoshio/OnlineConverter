import JSZip from "jszip";
import { describe, test, expect } from "vitest";
import {
  convertUnits,
  convertTime,
  generatePassword,
  createZip,
  inspectZip,
  extractZip,
} from "./operations";

type WritableArray = Uint8Array<ArrayBuffer> | Uint32Array<ArrayBuffer>;

function deterministicRandom(bytes: readonly number[] = [0]) {
  let offset = 0;
  return {
    getRandomValues<T extends WritableArray>(array: T): T {
      for (let index = 0; index < array.length; index += 1) {
        array[index] = bytes[offset % bytes.length] ?? 0;
        offset += 1;
      }
      return array;
    },
  };
}

describe("Utility Operations Engine", () => {
  describe("convertUnits", () => {
    test("converts length units accurately", () => {
      const result = convertUnits(1, "length", "km", "m");
      expect(result.numericValue).toBe(1000);
      expect(result.display).toBe("1000 m");
    });

    test("converts mass units accurately", () => {
      const result = convertUnits(1, "mass", "kg", "g");
      expect(result.numericValue).toBe(1000);
    });

    test("converts temperature Celsius to Fahrenheit", () => {
      const result = convertUnits(100, "temperature", "c", "f");
      expect(result.numericValue).toBe(212);
    });

    test("converts temperature Fahrenheit to Celsius", () => {
      const result = convertUnits(32, "temperature", "f", "c");
      expect(result.numericValue).toBe(0);
    });

    test("converts data size units", () => {
      const result = convertUnits(1, "data-size", "gb", "mb");
      expect(result.numericValue).toBe(1000);
    });

    test("supports every non-affine category declared by the manifest", () => {
      expect(convertUnits(1, "pressure", "bar", "pa").numericValue).toBe(100_000);
      expect(convertUnits(1, "energy", "kwh", "mj").numericValue).toBe(3.6);
      expect(convertUnits(1, "power", "hp", "w").numericValue).toBeCloseTo(745.6998715822702, 8);
      expect(convertUnits(1, "data-size", "gib", "b").numericValue).toBe(1_073_741_824);
      expect(convertUnits(180, "angle", "deg", "rad").numericValue).toBeCloseTo(Math.PI, 12);
    });

    test("rejects non-finite values and unsupported units", () => {
      expect(() => convertUnits(Number.POSITIVE_INFINITY, "length", "m", "km")).toThrow("finite");
      expect(() => convertUnits(1, "length", "parsec", "m")).toThrow("Unsupported unit");
    });
  });

  describe("convertTime", () => {
    test("formats time for UTC", () => {
      const result = convertTime("2026-08-28T12:00:00Z", "UTC", "UTC");
      expect(result.iso).toBe("2026-08-28T12:00:00.000Z");
      expect(result.zone).toBe("UTC");
    });

    test("interprets a zone-less wall time in the declared source zone", () => {
      const result = convertTime("2026-01-15T12:00:00", "Asia/Jakarta", "UTC");
      expect(result.iso).toBe("2026-01-15T05:00:00.000Z");
      expect(result.display).toContain("05:00:00");
      expect(result.zone).toBe("UTC");
      expect(result.utcOffset).toBe("GMT");
    });

    test("rejects invalid zones and nonexistent source wall times", () => {
      expect(() => convertTime("2026-01-15T12:00:00", "Not/AZone", "UTC")).toThrow("time zone");
      expect(() => convertTime("2026-03-08T02:30:00", "America/New_York", "UTC")).toThrow("wall time");
    });
  });

  describe("generatePassword", () => {
    test("generates password of requested length", () => {
      const pw = generatePassword({ length: 24 }, deterministicRandom([0, 1, 2, 3, 4, 5]));
      expect(pw.length).toBe(24);
    });

    test("generates password with only digits when requested", () => {
      const pw = generatePassword({
        length: 10,
        uppercase: false,
        lowercase: false,
        digits: true,
        symbols: false,
      }, deterministicRandom([0, 1, 2, 3]));
      expect(/^\d+$/.test(pw)).toBe(true);
    });

    test("excludes ambiguous characters by default", () => {
      const pw = generatePassword({ length: 50, excludeAmbiguous: true }, deterministicRandom([0, 10, 20, 30, 40]));
      expect(pw).not.toContain("0");
      expect(pw).not.toContain("O");
      expect(pw).not.toContain("1");
      expect(pw).not.toContain("l");
      expect(pw).not.toContain("I");
    });

    test("includes every selected character group and rejects unsafe configurations", () => {
      const pw = generatePassword({ length: 12, excludeAmbiguous: true }, deterministicRandom([0, 1, 2, 3, 4, 5]));
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[2-9]/);
      expect(pw).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);

      expect(() => generatePassword({ length: 3 }, deterministicRandom())).toThrow("between 4 and 128");
      expect(() => generatePassword({ length: 129 }, deterministicRandom())).toThrow("between 4 and 128");
      expect(() => generatePassword({ uppercase: false, lowercase: false, digits: false, symbols: false }, deterministicRandom())).toThrow("character group");
      expect(() => generatePassword({ length: 8 }, null)).toThrow("Secure random");
    });

    test("uses rejection sampling instead of modulo-biased bytes", () => {
      let fills = 0;
      const source = {
        getRandomValues<T extends WritableArray>(array: T): T {
          array.fill(fills++ === 0 ? 255 : 0);
          return array;
        },
      };
      const pw = generatePassword({ length: 4, uppercase: true, lowercase: false, digits: false, symbols: false }, source);
      expect(pw).toBe("AAAA");
      expect(fills).toBeGreaterThan(1);
    });
  });

  describe("createZip and extractZip", () => {
    test("creates and extracts ZIP archives roundtrip", async () => {
      const files = [
        { name: "hello.txt", bytes: new TextEncoder().encode("Hello, World!") },
        { name: "data.json", bytes: new TextEncoder().encode('{"key":"value"}') },
      ];

      const zipBytes = await createZip(files);
      expect(zipBytes.length).toBeGreaterThan(0);

      const extracted = await extractZip(zipBytes);
      expect(extracted.length).toBe(2);

      const hello = extracted.find((f) => f.name === "hello.txt");
      expect(hello).toBeDefined();
      expect(new TextDecoder().decode(hello!.bytes)).toBe("Hello, World!");

      const data = extracted.find((f) => f.name === "data.json");
      expect(data).toBeDefined();
      expect(new TextDecoder().decode(data!.bytes)).toBe('{"key":"value"}');
    });

    test.each(["../secret.txt", "/absolute.txt", "C:\\secret.txt", "nul\0name.txt"])(
      "rejects unsafe ZIP creation name %s",
      async (name) => {
        await expect(createZip([{ name, bytes: new Uint8Array([1]) }])).rejects.toThrow("Unsafe archive name");
      },
    );

    test("rejects duplicate normalized names and more than twenty inputs", async () => {
      await expect(createZip([
        { name: "folder\\same.txt", bytes: new Uint8Array([1]) },
        { name: "folder/same.txt", bytes: new Uint8Array([2]) },
      ])).rejects.toThrow("Duplicate archive name");

      const tooMany = Array.from({ length: 21 }, (_, index) => ({ name: `${index}.txt`, bytes: new Uint8Array() }));
      await expect(createZip(tooMany)).rejects.toThrow("20 files");
    });

    test("reports safe ZIP metadata without exposing an entry early", async () => {
      const bytes = await createZip([
        { name: "nested/hello.txt", bytes: new TextEncoder().encode("hello") },
        { name: "data.bin", bytes: new Uint8Array([1, 2, 3]) },
      ]);
      await expect(inspectZip(bytes)).resolves.toEqual({
        archiveEntries: 2,
        archiveDepth: 2,
        expandedBytes: 8,
      });
    });

    test("rejects unsafe original entry names and configured extraction limits", async () => {
      const malicious = new JSZip();
      malicious.file("../secret.txt", "secret");
      await expect(extractZip(await malicious.generateAsync({ type: "uint8array" }))).rejects.toThrow("Unsafe archive name");

      const nested = new JSZip();
      nested.file("a/b/c.txt", "12345");
      const nestedBytes = await nested.generateAsync({ type: "uint8array" });
      await expect(inspectZip(nestedBytes, { maxDepth: 2 })).rejects.toThrow("depth");
      await expect(extractZip(nestedBytes, { maxExpandedBytes: 4 })).rejects.toThrow("expanded-size");
      await expect(inspectZip(nestedBytes, { maxEntries: 0 })).rejects.toThrow("entries");
    });
  });
});
