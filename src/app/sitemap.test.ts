import { expect, test } from "vitest";
import sitemap from "./sitemap";

test("includes home and only active capabilities", () => {
  expect(sitemap()).toEqual([
    { url: "http://localhost:3000/" },
    { url: "http://localhost:3000/tools/merge-pdf" },
    { url: "http://localhost:3000/tools/split-pdf" },
    { url: "http://localhost:3000/tools/organize-pdf" },
    { url: "http://localhost:3000/tools/rotate-pdf" },
    { url: "http://localhost:3000/tools/delete-pdf-pages" },
    { url: "http://localhost:3000/tools/extract-pdf-pages" },
    { url: "http://localhost:3000/tools/page-numbers" },
    { url: "http://localhost:3000/tools/watermark-pdf" },
    { url: "http://localhost:3000/tools/image-to-pdf" },
    { url: "http://localhost:3000/tools/text-to-pdf" },
  ]);
});
