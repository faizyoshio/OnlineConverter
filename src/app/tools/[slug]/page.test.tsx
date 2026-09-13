import { expect, test } from "vitest";
import { generateMetadata, generateStaticParams } from "./page";

test("generates static routes for active tools only", () => {
  expect(generateStaticParams()).toEqual([
    { slug: "merge-pdf" },
    { slug: "split-pdf" },
    { slug: "organize-pdf" },
    { slug: "rotate-pdf" },
    { slug: "crop-pdf" },
    { slug: "resize-pdf" },
    { slug: "delete-pdf-pages" },
    { slug: "extract-pdf-pages" },
    { slug: "page-numbers" },
    { slug: "watermark-pdf" },
    { slug: "flatten-pdf" },
    { slug: "image-to-pdf" },
    { slug: "text-to-pdf" },
    { slug: "jpg-to-png-webp" },
    { slug: "webp-to-jpg" },
    { slug: "webp-to-png" },
    { slug: "jfif-to-png" },
    { slug: "compress-jpeg" },
    { slug: "compress-webp" },
    { slug: "resize-image" },
    { slug: "crop-image" },
    { slug: "circle-crop-image" },
    { slug: "rotate-image" },
    { slug: "flip-image" },
    { slug: "zip-maker" },
    { slug: "zip-extractor" },
    { slug: "unit-converter" },
    { slug: "time-converter" },
    { slug: "password-generator" },
  ]);
});

test("emits metadata only for active tool routes", async () => {
  await expect(generateMetadata({ params: Promise.resolve({ slug: "merge-pdf" }) })).resolves.toMatchObject({
    title: "Merge PDF | ScholarKit",
  });
  await expect(generateMetadata({ params: Promise.resolve({ slug: "compress-pdf" }) })).resolves.toEqual({});
  await expect(generateMetadata({ params: Promise.resolve({ slug: "barcode-generator" }) })).resolves.toEqual({});
});
