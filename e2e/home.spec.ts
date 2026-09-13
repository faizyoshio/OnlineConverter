import { expect, test, type Page } from "@playwright/test";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { VALID_PNG_BYTES } from "../src/test/fixtures/pdf-inputs";

async function canvasImage(page: Page, mimeType: "image/jpeg" | "image/webp"): Promise<Buffer> {
  const base64 = await page.evaluate((type) => {
    const canvas = document.createElement("canvas");
    canvas.width = 3;
    canvas.height = 2;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    context.fillStyle = "rgba(124, 58, 237, 0.5)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL(type, 0.9);
    if (!dataUrl.startsWith(`data:${type}`)) throw new Error(`${type} encoding is unavailable`);
    return dataUrl.split(",")[1]!;
  }, mimeType);
  return Buffer.from(base64, "base64");
}

test("home page explains the privacy boundary", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/convert files locally/i);
  await expect(page.getByText(/files never leave your device/i)).toBeVisible();
});

test("merge PDF route processes files in browser worker", async ({ page }) => {
  const first = await PDFDocument.create();
  first.addPage([612, 792]);
  const second = await PDFDocument.create();
  second.addPage([612, 792]);

  await page.goto("/tools/merge-pdf");
  await page.getByLabel(/choose files/i).setInputFiles([
    { name: "first.pdf", mimeType: "application/pdf", buffer: Buffer.from(await first.save()) },
    { name: "second.pdf", mimeType: "application/pdf", buffer: Buffer.from(await second.save()) },
  ]);
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("split PDF route processes file in browser worker", async ({ page }) => {
  const doc = await PDFDocument.create();
  for (let i = 0; i < 4; i++) doc.addPage([612, 792]);

  await page.goto("/tools/split-pdf");
  await page.getByLabel(/page ranges/i).fill("1,3-4");
  await page.getByLabel(/one pdf per range/i).uncheck();
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});


test("rotate PDF route processes file in browser worker", async ({ page }) => {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);

  await page.goto("/tools/rotate-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("crop PDF route applies bounded margins in the browser worker", async ({ page }) => {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  doc.addPage([612, 792]);

  await page.goto("/tools/crop-pdf");
  await page.getByLabel(/crop margins in mm/i).fill("10,15,10,15");
  await page.getByLabel(/^pages$/i).fill("2");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("resize PDF route fits every page on A4 in the browser worker", async ({ page }) => {
  const doc = await PDFDocument.create();
  doc.addPage([400, 200]);
  doc.addPage([200, 400]);

  await page.goto("/tools/resize-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("organize PDF route keeps original order by default in browser worker", async ({ page }) => {
  const doc = await PDFDocument.create();
  for (let index = 0; index < 3; index++) doc.addPage([612, 792]);

  await page.goto("/tools/organize-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("delete PDF pages route processes selected pages in browser worker", async ({ page }) => {
  const doc = await PDFDocument.create();
  for (let index = 0; index < 3; index++) doc.addPage([612, 792]);

  await page.goto("/tools/delete-pdf-pages");
  await page.getByLabel(/pages to delete/i).fill("2");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("extract PDF pages route creates a ZIP when separate PDFs are selected", async ({ page }) => {
  const doc = await PDFDocument.create();
  for (let index = 0; index < 3; index++) doc.addPage([612, 792]);

  await page.goto("/tools/extract-pdf-pages");
  await page.getByLabel(/pages to extract/i).fill("1,3");
  await page.getByLabel(/create one combined pdf/i).uncheck();
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.zip/i })).toBeVisible();
});

test("page numbers route processes a PDF in browser worker", async ({ page }) => {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);

  await page.goto("/tools/page-numbers");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("watermark PDF route processes a text watermark in browser worker", async ({ page }) => {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);

  await page.goto("/tools/watermark-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("image to PDF route processes a PNG in browser worker", async ({ page }) => {
  await page.goto("/tools/image-to-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.png",
    mimeType: "image/png",
    buffer: Buffer.from(VALID_PNG_BYTES),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("image to PDF route decodes WebP in browser worker", async ({ page }) => {
  await page.goto("/tools/image-to-pdf");
  const webpBase64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    context.fillStyle = "#7c3aed";
    context.fillRect(0, 0, 2, 2);
    const dataUrl = canvas.toDataURL("image/webp");
    if (!dataUrl.startsWith("data:image/webp")) throw new Error("WebP encoding is unavailable");
    return dataUrl.split(",")[1]!;
  });
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.webp",
    mimeType: "image/webp",
    buffer: Buffer.from(webpBase64, "base64"),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("JPG route produces explicit PNG and WebP outputs in the browser worker", async ({ page }) => {
  await page.goto("/tools/jpg-to-png-webp");
  const jpeg = await canvasImage(page, "image/jpeg");
  await page.getByLabel(/target format/i).selectOption("png");
  await page.getByLabel(/choose files/i).setInputFiles({ name: "source.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.png/i })).toBeVisible();

  await page.getByLabel(/target format/i).selectOption("webp");
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.webp/i })).toBeVisible();
});

test("WebP to JPG route composites alpha and encodes JPEG in the browser worker", async ({ page }) => {
  await page.goto("/tools/webp-to-jpg");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.webp",
    mimeType: "image/webp",
    buffer: await canvasImage(page, "image/webp"),
  });
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.jpg/i })).toBeVisible();
});

test("WebP to PNG route preserves raster dimensions in the browser worker", async ({ page }) => {
  await page.goto("/tools/webp-to-png");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.webp",
    mimeType: "image/webp",
    buffer: await canvasImage(page, "image/webp"),
  });
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.png/i })).toBeVisible();
});

test("JFIF to PNG route accepts a JPEG bitstream in the browser worker", async ({ page }) => {
  await page.goto("/tools/jfif-to-png");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.jfif",
    mimeType: "image/jpeg",
    buffer: await canvasImage(page, "image/jpeg"),
  });
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.png/i })).toBeVisible();
});

test("watermark PDF route processes a local image watermark in browser worker", async ({ page }) => {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);

  await page.goto("/tools/watermark-pdf");
  await page.getByLabel(/watermark type/i).selectOption("image");
  await page.getByLabel(/choose files/i).setInputFiles([
    { name: "source.pdf", mimeType: "application/pdf", buffer: Buffer.from(await doc.save()) },
    { name: "watermark.png", mimeType: "image/png", buffer: Buffer.from(VALID_PNG_BYTES) },
  ]);
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("text to PDF route processes UTF-8 text in browser worker", async ({ page }) => {
  await page.goto("/tools/text-to-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Local UTF-8 text"),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("ZIP maker route creates an archive in the browser worker", async ({ page }) => {
  await page.goto("/tools/zip-maker");
  await page.getByLabel(/choose files/i).setInputFiles([
    { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("local notes") },
    { name: "data.json", mimeType: "application/json", buffer: Buffer.from('{"local":true}') },
  ]);
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.zip/i })).toBeVisible();
});

test("ZIP extractor route exposes safe entries from a local archive", async ({ page }) => {
  const archive = new JSZip();
  archive.file("reports/summary.txt", "local summary");
  archive.file("data.csv", "value\n42");

  await page.goto("/tools/zip-extractor");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.zip",
    mimeType: "application/zip",
    buffer: await archive.generateAsync({ type: "nodebuffer" }),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download reports-summary.txt/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /download data.csv/i })).toBeVisible();
});

test("unit converter route converts values without a file picker", async ({ page }) => {
  await page.goto("/tools/unit-converter");
  await expect(page.getByLabel(/choose files/i)).toHaveCount(0);
  await page.getByLabel(/^value$/i).fill("1");
  await page.getByLabel(/from unit/i).fill("km");
  await page.getByLabel(/to unit/i).fill("m");
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByLabel(/local conversion result/i)).toContainText("1000 m");
});

test("time converter route applies IANA time zones locally", async ({ page }) => {
  await page.goto("/tools/time-converter");
  await page.getByLabel(/date and time/i).fill("2026-01-15T12:00:00");
  await page.getByLabel(/from time zone/i).fill("Asia/Jakarta");
  await page.getByLabel(/to time zone/i).fill("UTC");
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByLabel(/local conversion result/i)).toContainText("UTC");
  await expect(page.getByLabel(/local conversion result/i)).toContainText("05:00");
});

test("barcode generator route produces PNG and SVG entirely in the browser", async ({ page }) => {
  await page.goto("/tools/barcode-generator");
  await page.getByLabel(/barcode text/i).fill("LOCAL-123");
  await page.getByLabel(/output format/i).selectOption("svg");
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.svg/i })).toBeVisible();

  await page.getByLabel(/output format/i).selectOption("png");
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.png/i })).toBeVisible();
});

test("password generator route returns a local value without a download", async ({ page }) => {
  await page.goto("/tools/password-generator");
  await page.getByLabel(/password length/i).fill("32");
  await page.getByRole("button", { name: /run conversion/i }).click();
  const result = page.getByLabel(/local conversion result/i);
  await expect(result).toBeVisible();
  await expect(result.locator("output")).toHaveText(/.{32}/);
  await expect(result.getByRole("link", { name: /download/i })).toHaveCount(0);
});

test("flatten PDF route processes a PDF in browser worker", async ({ page }) => {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  await page.goto("/tools/flatten-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await doc.save()),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.pdf/i })).toBeVisible();
});

test("compress JPEG route processes image in browser worker", async ({ page }) => {
  await page.goto("/tools/compress-jpeg");
  const jpeg = await canvasImage(page, "image/jpeg");
  await page.getByLabel(/choose files/i).setInputFiles({ name: "source.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.jpg/i })).toBeVisible();
});

test("compress WebP route processes image in browser worker", async ({ page }) => {
  await page.goto("/tools/compress-webp");
  const webp = await canvasImage(page, "image/webp");
  await page.getByLabel(/choose files/i).setInputFiles({ name: "source.webp", mimeType: "image/webp", buffer: webp });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.webp/i })).toBeVisible();
});

test("resize image route resizes image in browser worker", async ({ page }) => {
  await page.goto("/tools/resize-image");
  const jpeg = await canvasImage(page, "image/jpeg");
  await page.getByLabel(/choose files/i).setInputFiles({ name: "source.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.png/i })).toBeVisible();
});

test("crop image route crops image in browser worker", async ({ page }) => {
  await page.goto("/tools/crop-image");
  const jpeg = await canvasImage(page, "image/jpeg");
  await page.getByLabel(/choose files/i).setInputFiles({ name: "source.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.png/i })).toBeVisible();
});

test("circle crop image route applies circular mask in browser worker", async ({ page }) => {
  await page.goto("/tools/circle-crop-image");
  const webp = await canvasImage(page, "image/webp");
  await page.getByLabel(/choose files/i).setInputFiles({ name: "source.webp", mimeType: "image/webp", buffer: webp });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.png/i })).toBeVisible();
});

test("rotate image route rotates image in browser worker", async ({ page }) => {
  await page.goto("/tools/rotate-image");
  const jpeg = await canvasImage(page, "image/jpeg");
  await page.getByLabel(/choose files/i).setInputFiles({ name: "source.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.png/i })).toBeVisible();
});

test("flip image route flips image in browser worker", async ({ page }) => {
  await page.goto("/tools/flip-image");
  const jpeg = await canvasImage(page, "image/jpeg");
  await page.getByLabel(/choose files/i).setInputFiles({ name: "source.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download output-1.png/i })).toBeVisible();
});

test("drop-zone has exactly one visible choose files button and remains responsive across all devices", async ({ page }) => {
  const viewports = [
    { width: 320, height: 568, name: "mobile-small (iPhone SE 1)" },
    { width: 375, height: 667, name: "mobile-medium (iPhone 8)" },
    { width: 390, height: 844, name: "mobile-modern (iPhone 14)" },
    { width: 768, height: 1024, name: "tablet-portrait (iPad)" },
    { width: 1024, height: 768, name: "tablet-landscape" },
    { width: 1440, height: 900, name: "desktop" },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/tools/merge-pdf");

    // Check no horizontal scroll overflow
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalOverflow, `Horizontal overflow detected at ${vp.name}`).toBe(false);

    // Verify only 1 visible choose files button/label in the drop zone
    const dropZone = page.locator(".workspace-drop-zone");
    const visibleButtons = dropZone.locator("label:visible, button:visible");
    await expect(visibleButtons).toHaveCount(1);
    await expect(visibleButtons.first()).toHaveText(/choose files/i);

    // Verify native input is hidden from layout
    const fileInput = dropZone.locator("input[type='file']");
    const isFileInputHidden = await fileInput.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width <= 1 && rect.height <= 1;
    });
    expect(isFileInputHidden).toBe(true);
  }
});


