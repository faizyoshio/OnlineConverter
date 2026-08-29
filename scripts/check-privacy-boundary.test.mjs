import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { scanPrivacyBoundary } from "./check-privacy-boundary.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(rootDir, "scripts", "fixtures", "privacy");

function scanFixture(name) {
  return scanPrivacyBoundary({ rootDir, roots: [path.join(fixtures, name)] });
}

function scanTelemetryFixture(name) {
  return scanPrivacyBoundary({
    rootDir,
    roots: [],
    telemetryFiles: [path.join(fixtures, name)],
  });
}

test("allows metadata-only server route", () => {
  assert.deepEqual(scanFixture("allowed-metadata-route.ts").violations, []);
});

test("rejects server routes reading file bodies", () => {
  const report = scanFixture("forbidden-file-route.ts");
  assert.ok(report.violations.some((violation) => violation.message.includes("request.formData()")));
  assert.ok(report.violations.some((violation) => violation.message.includes("Blob")));
});

test("follows local imports to client-only conversion modules", () => {
  const report = scanFixture("forbidden-import-route.ts");
  assert.ok(report.violations.some((violation) => violation.message.includes("src/features/results")));
  assert.ok(report.violations.some((violation) => violation.message.includes("src/features/engines")));
});

test("rejects telemetry builders spreading or retaining private fields", () => {
  const report = scanTelemetryFixture("forbidden-telemetry.ts");
  assert.ok(report.violations.some((violation) => violation.message.includes("object spread")));
  assert.ok(report.violations.some((violation) => violation.message.includes("ocrText")));
});
