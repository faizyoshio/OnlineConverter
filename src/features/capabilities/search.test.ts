import { capabilityRegistry } from "./index";
import { normalizeSearchText, searchCapabilities } from "./search";

test("ranks an exact title match before alias matches", () => {
  const results = searchCapabilities("PDF to JPG", capabilityRegistry);
  expect(results[0]?.id).toBe("pdf.to-jpg");
});

test("normalizes arrows, spacing, and case", () => {
  const results = searchCapabilities("  PDF ↔ IMAGE  ", capabilityRegistry);
  expect(results.some((item) => item.id === "pdf.to-image")).toBe(true);
});

test("normalizes unicode marks and punctuation", () => {
  expect(normalizeSearchText("  HéIC → JPG!!! ")).toBe("heic jpg");
});

test("breaks equal scores by English title order", () => {
  const results = searchCapabilities("compress", capabilityRegistry);
  const titles = results.map((item) => item.title);
  expect(titles).toEqual([...titles].sort((left, right) => left.localeCompare(right, "en")));
});

test("returns the stable title order for an empty query", () => {
  const results = searchCapabilities("   ", capabilityRegistry);
  expect(results).toHaveLength(capabilityRegistry.length);
  expect(results.map((item) => item.title)).toEqual(
    [...results].map((item) => item.title).sort((left, right) => left.localeCompare(right, "en")),
  );
});
