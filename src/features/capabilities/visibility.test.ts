import { capabilityRegistry } from "./index";
import { getVisibleCapabilities } from "./visibility";

const activeIds = [
  "pdf.merge",
  "pdf.split",
  "pdf.organize",
  "pdf.rotate",
  "pdf.crop",
  "pdf.resize",
  "pdf.delete-pages",
  "pdf.extract-pages",
  "pdf.page-numbers",
  "pdf.watermark",
  "pdf.flatten",
  "pdf.image-to-pdf",
  "pdf.text-to-pdf",
  "image.jpg-to-modern",
  "image.webp-to-jpg",
  "image.webp-to-png",
  "image.jfif-to-png",
  "image.compress-jpeg",
  "image.compress-webp",
  "image.resize",
  "image.crop",
  "image.circle-crop",
  "image.rotate",
  "image.flip",
  "archive.zip-create",
  "archive.zip-extract",
  "utility.unit",
  "utility.time",
  "utility.password",
];

test("production hides planned capabilities while keeping active capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "production", previewRequested: true }).map((item) => item.id)).toEqual(activeIds);
});

test("preview review mode returns planned capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "preview", previewRequested: true })).toHaveLength(70);
});

test("local mode requires an explicit preview request for planned capabilities", () => {
  expect(getVisibleCapabilities(capabilityRegistry, { environment: "local", previewRequested: false }).map((item) => item.id)).toEqual(activeIds);
});

test("active capabilities remain visible in every environment", () => {
  const active = { ...capabilityRegistry[0]!, releaseStatus: "active" as const };
  expect(getVisibleCapabilities([active], { environment: "production", previewRequested: false })).toEqual([active]);
});
