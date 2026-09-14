import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { VALID_PNG_BYTES } from "../src/test/fixtures/pdf-inputs";
import { VALID_JPEG_BYTES } from "../src/test/fixtures/image-inputs";
import { createDocx, createPptx, createXlsx } from "../src/engines/office/openxml";

async function createSamplePdf(pageCount = 1): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([612, 792]);
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

test("home page explains the privacy boundary and displays 8 categories", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/academic & research toolkit/i);
  await expect(page.getByText(/files never leave your device/i)).toBeVisible();

  // Verify the 8 category headers
  await expect(page.locator(".catalog-group-title", { hasText: "OPTIMIZE PDF" })).toBeVisible();
  await expect(page.locator(".catalog-group-title", { hasText: "MERGE & SPLIT" })).toBeVisible();
  await expect(page.locator(".catalog-group-title", { hasText: "VIEW & EDIT" })).toBeVisible();
  await expect(page.locator(".catalog-group-title", { hasText: "CONVERT TO PDF" })).toBeVisible();
  await expect(page.locator(".catalog-group-title", { hasText: "CONVERT FROM PDF" })).toBeVisible();
  await expect(page.locator(".catalog-group-title", { hasText: "PDF SECURITY" })).toBeVisible();
  await expect(page.locator(".catalog-group-title", { hasText: "OPTIMIZE IMAGE" })).toBeVisible();
  await expect(page.locator(".catalog-group-title", { hasText: "CONVERT IMAGE" })).toBeVisible();
});

test("header mega-menu opens and navigates to tools", async ({ page }) => {
  await page.goto("/");

  const pdfBtn = page.locator(".site-header").getByRole("button", { name: /PDF Tools/i });
  await expect(pdfBtn).toBeVisible();
  await pdfBtn.click();
  await expect(page.locator(".mega-menu")).toBeVisible();
  await expect(page.locator(".mega-menu").getByRole("link", { name: "Merge PDF", exact: true })).toBeVisible();
  await expect(page.locator(".mega-menu").getByRole("link", { name: "Compress PDF", exact: true })).toBeVisible();
  await expect(page.locator(".mega-menu").getByRole("link", { name: "Unlock PDF", exact: true })).toBeVisible();

  const imgBtn = page.locator(".site-header").getByRole("button", { name: /Image Tools/i });
  await expect(imgBtn).toBeVisible();
  await imgBtn.click();
  await expect(page.locator(".mega-menu").getByRole("link", { name: "Compress Image", exact: true })).toBeVisible();
  await expect(page.locator(".mega-menu").getByRole("link", { name: "Compress JPG", exact: true })).toBeVisible();
  await expect(page.locator(".mega-menu").getByRole("link", { name: "Image to JPG", exact: true })).toBeVisible();
});

// ----------------------------------------------------------------------------
// 1. ORGANIZE PDF
// ----------------------------------------------------------------------------

test("merge PDF route processes files in browser worker", async ({ page }) => {
  const first = await createSamplePdf(1);
  const second = await createSamplePdf(1);

  await page.goto("/tools/merge-pdf");
  await page.getByLabel(/choose files/i).setInputFiles([
    { name: "first.pdf", mimeType: "application/pdf", buffer: first },
    { name: "second.pdf", mimeType: "application/pdf", buffer: second },
  ]);
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("split PDF route processes file in browser worker", async ({ page }) => {
  const doc = await createSamplePdf(4);

  await page.goto("/tools/split-pdf");
  await page.getByLabel(/page ranges/i).fill("1,3-4");
  await page.getByLabel(/one pdf per range/i).uncheck();
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: doc,
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("remove pages route processes selected pages in browser worker", async ({ page }) => {
  const doc = await createSamplePdf(3);

  await page.goto("/tools/remove-pdf-pages");
  await page.getByLabel(/pages to delete/i).fill("2");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: doc,
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("extract pages route creates a ZIP when separate PDFs are selected", async ({ page }) => {
  const doc = await createSamplePdf(3);

  await page.goto("/tools/extract-pdf-pages");
  await page.getByLabel(/pages to extract/i).fill("1,3");
  await page.getByLabel(/create one combined pdf/i).uncheck();
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: doc,
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("organize PDF route processes in browser worker", async ({ page }) => {
  const doc = await createSamplePdf(3);

  await page.goto("/tools/organize-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: doc,
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("rotate PDF route rotates pages in browser worker", async ({ page }) => {
  const doc = await createSamplePdf(1);

  await page.goto("/tools/rotate-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: doc,
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

// ----------------------------------------------------------------------------
// 2. OPTIMIZE PDF & IMAGES
// ----------------------------------------------------------------------------

test("compress PDF route displays 4 compression preset cards and compresses PDF", async ({ page }) => {
  const doc = await createSamplePdf(2);

  await page.goto("/tools/compress-pdf");

  // Verify dedicated 4 preset card UI
  await expect(page.getByRole("heading", { name: "Kompres PDF" })).toBeVisible();
  await expect(page.locator(".pdf-compress-card__name", { hasText: "Dasar" })).toBeVisible();
  await expect(page.locator(".pdf-compress-card__name", { hasText: "Sedang" })).toBeVisible();
  await expect(page.locator(".pdf-compress-card__name", { hasText: "Kuat" })).toBeVisible();
  await expect(page.locator(".pdf-compress-badge", { hasText: "Terkecil" })).toBeVisible();
  await expect(page.locator(".pdf-compress-card__name", { hasText: "Kustom" })).toBeVisible();

  // Select Kuat preset
  await page.locator(".pdf-compress-card__name", { hasText: "Kuat" }).click();

  // Upload file and run
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: doc,
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("compress image route processes image in browser worker", async ({ page }) => {
  await page.goto("/tools/compress-image");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: Buffer.from(VALID_PNG_BYTES),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

// ----------------------------------------------------------------------------
// 3. CONVERT TO PDF
// ----------------------------------------------------------------------------

test("JPG to PDF route converts image to PDF", async ({ page }) => {
  await page.goto("/tools/jpg-to-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from(VALID_JPEG_BYTES),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("WORD to PDF route converts DOCX to PDF", async ({ page }) => {
  const docxBytes = await createDocx(["Thesis Chapter 1", "Introduction and background"]);

  await page.goto("/tools/word-to-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "document.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from(docxBytes),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("POWERPOINT to PDF route converts PPTX to PDF", async ({ page }) => {
  const pptxBytes = await createPptx(["Slide 1: Overview", "Slide 2: Results"]);

  await page.goto("/tools/powerpoint-to-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "presentation.pptx",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    buffer: Buffer.from(pptxBytes),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("EXCEL to PDF route converts XLSX to PDF", async ({ page }) => {
  const xlsxBytes = await createXlsx([["Header 1", "Header 2"], ["Val 1", "Val 2"]]);

  await page.goto("/tools/excel-to-pdf");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "sheet.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(xlsxBytes),
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

// ----------------------------------------------------------------------------
// 4. CONVERT FROM PDF
// ----------------------------------------------------------------------------

test("PDF to JPG route converts PDF to JPG", async ({ page }) => {
  const doc = await createSamplePdf(1);

  await page.goto("/tools/pdf-to-jpg");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: doc,
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("PDF to WORD route converts PDF to DOCX", async ({ page }) => {
  const doc = await createSamplePdf(1);

  await page.goto("/tools/pdf-to-word");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: doc,
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("PDF to POWERPOINT route converts PDF to PPTX", async ({ page }) => {
  const doc = await createSamplePdf(1);

  await page.goto("/tools/pdf-to-powerpoint");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: doc,
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
});

test("PDF to EXCEL route converts PDF to XLSX", async ({ page }) => {
  const doc = await createSamplePdf(1);

  await page.goto("/tools/pdf-to-excel");
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "source.pdf",
    mimeType: "application/pdf",
    buffer: doc,
  });
  await expect(page.getByRole("button", { name: /run conversion/i })).toBeEnabled();
  await page.getByRole("button", { name: /run conversion/i }).click();
  await expect(page.getByRole("link", { name: /download (Scholar-)?/i })).toBeVisible();
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
