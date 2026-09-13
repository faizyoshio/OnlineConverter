import { afterEach, expect, test } from "vitest";
import sitemap from "./sitemap";

const originalSiteUrl = process.env.SITE_URL;
const originalVercelEnvironment = process.env.VERCEL_ENV;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = originalSiteUrl;
  if (originalVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnvironment;
});

test("includes home and only active capabilities", () => {
  delete process.env.SITE_URL;
  process.env.VERCEL_ENV = "development";
  expect(sitemap()).toEqual([
    { url: "http://localhost:3000/" },
    { url: "http://localhost:3000/tools/merge-pdf" },
    { url: "http://localhost:3000/tools/split-pdf" },
    { url: "http://localhost:3000/tools/organize-pdf" },
    { url: "http://localhost:3000/tools/rotate-pdf" },
    { url: "http://localhost:3000/tools/crop-pdf" },
    { url: "http://localhost:3000/tools/resize-pdf" },
    { url: "http://localhost:3000/tools/delete-pdf-pages" },
    { url: "http://localhost:3000/tools/extract-pdf-pages" },
    { url: "http://localhost:3000/tools/page-numbers" },
    { url: "http://localhost:3000/tools/watermark-pdf" },
    { url: "http://localhost:3000/tools/image-to-pdf" },
    { url: "http://localhost:3000/tools/text-to-pdf" },
    { url: "http://localhost:3000/tools/jpg-to-png-webp" },
    { url: "http://localhost:3000/tools/webp-to-jpg" },
    { url: "http://localhost:3000/tools/webp-to-png" },
    { url: "http://localhost:3000/tools/jfif-to-png" },
    { url: "http://localhost:3000/tools/compress-jpeg" },
    { url: "http://localhost:3000/tools/compress-webp" },
    { url: "http://localhost:3000/tools/resize-image" },
    { url: "http://localhost:3000/tools/crop-image" },
    { url: "http://localhost:3000/tools/circle-crop-image" },
    { url: "http://localhost:3000/tools/rotate-image" },
    { url: "http://localhost:3000/tools/flip-image" },
    { url: "http://localhost:3000/tools/zip-maker" },
    { url: "http://localhost:3000/tools/zip-extractor" },
    { url: "http://localhost:3000/tools/unit-converter" },
    { url: "http://localhost:3000/tools/time-converter" },
    { url: "http://localhost:3000/tools/barcode-generator" },
    { url: "http://localhost:3000/tools/password-generator" },
  ]);
});
