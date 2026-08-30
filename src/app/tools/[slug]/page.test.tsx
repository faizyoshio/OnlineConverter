import { expect, test } from "vitest";
import { generateMetadata, generateStaticParams } from "./page";

test("generates static routes for active tools only", () => {
  expect(generateStaticParams()).toEqual([
    { slug: "merge-pdf" },
    { slug: "split-pdf" },
    { slug: "organize-pdf" },
    { slug: "rotate-pdf" },
    { slug: "delete-pdf-pages" },
    { slug: "extract-pdf-pages" },
    { slug: "page-numbers" },
    { slug: "watermark-pdf" },
    { slug: "image-to-pdf" },
    { slug: "text-to-pdf" },
  ]);
});

test("emits metadata only for active tool routes", async () => {
  await expect(generateMetadata({ params: Promise.resolve({ slug: "merge-pdf" }) })).resolves.toMatchObject({
    title: "Merge PDF | OnlineConverter",
  });
  await expect(generateMetadata({ params: Promise.resolve({ slug: "compress-pdf" }) })).resolves.toEqual({});
});
