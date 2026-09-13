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
  const map = sitemap();
  expect(map[0]).toEqual({ url: "http://localhost:3000/" });
  expect(map).toHaveLength(39);
  expect(map.some((entry) => entry.url === "http://localhost:3000/tools/merge-pdf")).toBe(true);
  expect(map.some((entry) => entry.url === "http://localhost:3000/tools/compress-pdf")).toBe(true);
  expect(map.some((entry) => entry.url === "http://localhost:3000/tools/compress-image")).toBe(true);
  expect(map.some((entry) => entry.url === "http://localhost:3000/tools/scan-to-pdf")).toBe(false);
});
