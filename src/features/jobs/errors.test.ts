import { normalizeJobError } from "./errors";

test("sanitizes unknown errors without retaining paths or filenames", () => {
  const normalized = normalizeJobError(new Error("C:\\Users\\person\\secret.pdf failed"), "processing");
  expect(normalized).toEqual({
    code: "conversion-failed",
    publicMessage: "The local conversion could not be completed.",
    retryable: true,
    phase: "processing",
  });
  const serialized = JSON.stringify(normalized);
  expect(serialized).not.toContain("secret.pdf");
  expect(serialized).not.toContain("C:\\Users");
  expect(serialized).not.toContain("secret.pdf failed");
});

test("maps a known tagged error to fixed public copy", () => {
  expect(normalizeJobError({ code: "limit-exceeded", phase: "validating", message: "private.pdf" })).toEqual({
    code: "limit-exceeded",
    publicMessage: "The selected input exceeds this tool's local limit.",
    retryable: false,
    phase: "validating",
  });
});

test("ignores unknown object properties and invalid phases", () => {
  const normalized = normalizeJobError({ code: "not-real", phase: "secret", filename: "secret.pdf", stack: "private" });
  expect(normalized).toEqual({
    code: "conversion-failed",
    publicMessage: "The local conversion could not be completed.",
    retryable: true,
    phase: "processing",
  });
  expect(JSON.stringify(normalized)).not.toMatch(/secret|private/i);
});
