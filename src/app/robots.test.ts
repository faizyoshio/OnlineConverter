import { afterEach, expect, test } from "vitest";
import robots from "./robots";

const originalVercelEnvironment = process.env.VERCEL_ENV;

afterEach(() => {
  if (originalVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnvironment;
});

test("blocks preview crawlers and publishes a local sitemap elsewhere", () => {
  process.env.VERCEL_ENV = "preview";
  expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });

  process.env.VERCEL_ENV = "development";
  expect(robots()).toEqual({
    rules: { userAgent: "*", allow: "/" },
    sitemap: "http://localhost:3000/sitemap.xml",
  });
});
