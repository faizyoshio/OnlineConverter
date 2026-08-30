import { describe, test, expect } from "vitest";
import {
  convertUnits,
  convertTime,
  generatePassword,
  createZip,
  extractZip,
} from "./operations";

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
      const result = convertUnits(1, "data", "gb", "mb");
      expect(result.numericValue).toBe(1000);
    });
  });

  describe("convertTime", () => {
    test("formats time for UTC", () => {
      const result = convertTime("2026-08-28T12:00:00Z", "UTC", "UTC");
      expect(result.iso).toBe("2026-08-28T12:00:00.000Z");
      expect(result.zone).toBe("UTC");
    });
  });

  describe("generatePassword", () => {
    test("generates password of requested length", () => {
      const pw = generatePassword({ length: 24 });
      expect(pw.length).toBe(24);
    });

    test("generates password with only digits when requested", () => {
      const pw = generatePassword({
        length: 10,
        uppercase: false,
        lowercase: false,
        digits: true,
        symbols: false,
      });
      expect(/^\d+$/.test(pw)).toBe(true);
    });

    test("excludes ambiguous characters by default", () => {
      // Run multiple times to verify
      for (let i = 0; i < 20; i++) {
        const pw = generatePassword({ length: 50, excludeAmbiguous: true });
        expect(pw).not.toContain("0");
        expect(pw).not.toContain("O");
        expect(pw).not.toContain("1");
        expect(pw).not.toContain("l");
        expect(pw).not.toContain("I");
      }
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
  });
});
