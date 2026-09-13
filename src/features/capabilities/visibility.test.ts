import { capabilityRegistry } from "./index";
import { getVisibleCapabilities } from "./visibility";

const activeIds = [
  "pdf.merge",
  "pdf.split",
  "pdf.delete-pages",
  "pdf.extract-pages",
  "pdf.organize",
  "pdf.scan",
  "pdf.compress",
  "pdf.repair",
  "pdf.ocr",
  "pdf.image-to-pdf",
  "pdf.word-to-pdf",
  "pdf.powerpoint-to-pdf",
  "pdf.excel-to-pdf",
  "pdf.to-jpg",
  "pdf.pdf-to-word",
  "pdf.pdf-to-powerpoint",
  "pdf.pdf-to-excel",
];

test("production hides planned capabilities while keeping active capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "production", previewRequested: true }).map((item) => item.id)).toEqual(activeIds);
});

test("preview review mode returns planned capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "preview", previewRequested: true })).toHaveLength(capabilityRegistry.length);
});

test("local mode requires an explicit preview request for planned capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "local", previewRequested: false }).map((item) => item.id)).toEqual(activeIds);
});

test("active capabilities remain visible in every environment", () => {
  const active = { ...capabilityRegistry[0]!, releaseStatus: "active" as const };
  expect(getVisibleCapabilities([active], { environment: "production", previewRequested: false })).toEqual([active]);
});
