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
    { url: "http://localhost:3000/tools/remove-pages" },
    { url: "http://localhost:3000/tools/extract-pages" },
    { url: "http://localhost:3000/tools/organize-pdf" },
    { url: "http://localhost:3000/tools/scan-to-pdf" },
    { url: "http://localhost:3000/tools/compress-pdf" },
    { url: "http://localhost:3000/tools/repair-pdf" },
    { url: "http://localhost:3000/tools/ocr-pdf" },
    { url: "http://localhost:3000/tools/jpg-to-pdf" },
    { url: "http://localhost:3000/tools/word-to-pdf" },
    { url: "http://localhost:3000/tools/powerpoint-to-pdf" },
    { url: "http://localhost:3000/tools/excel-to-pdf" },
    { url: "http://localhost:3000/tools/pdf-to-jpg" },
    { url: "http://localhost:3000/tools/pdf-to-word" },
    { url: "http://localhost:3000/tools/pdf-to-powerpoint" },
    { url: "http://localhost:3000/tools/pdf-to-excel" },
  ]);
});
