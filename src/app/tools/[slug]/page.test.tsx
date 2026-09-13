import { expect, test } from "vitest";
import { generateMetadata, generateStaticParams } from "./page";

test("generates static routes for active tools only", () => {
  expect(generateStaticParams()).toEqual([
    { slug: "merge-pdf" },
    { slug: "split-pdf" },
    { slug: "remove-pages" },
    { slug: "extract-pages" },
    { slug: "organize-pdf" },
    { slug: "scan-to-pdf" },
    { slug: "compress-pdf" },
    { slug: "repair-pdf" },
    { slug: "ocr-pdf" },
    { slug: "jpg-to-pdf" },
    { slug: "word-to-pdf" },
    { slug: "powerpoint-to-pdf" },
    { slug: "excel-to-pdf" },
    { slug: "pdf-to-jpg" },
    { slug: "pdf-to-word" },
    { slug: "pdf-to-powerpoint" },
    { slug: "pdf-to-excel" },
  ]);
});

test("emits metadata only for active tool routes", async () => {
  await expect(generateMetadata({ params: Promise.resolve({ slug: "merge-pdf" }) })).resolves.toMatchObject({
    title: "Merge PDF | ScholarKit",
  });
  await expect(generateMetadata({ params: Promise.resolve({ slug: "compress-pdf" }) })).resolves.toMatchObject({
    title: "Compress PDF | ScholarKit",
  });
  await expect(generateMetadata({ params: Promise.resolve({ slug: "rotate-pdf" }) })).resolves.toEqual({});
  await expect(generateMetadata({ params: Promise.resolve({ slug: "barcode-generator" }) })).resolves.toEqual({});
});
