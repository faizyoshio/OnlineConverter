import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { VALID_PNG_BYTES } from "../src/test/fixtures/pdf-inputs";

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
