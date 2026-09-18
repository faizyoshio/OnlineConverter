import { expect, test } from "vitest";
import { generateMetadata, generateStaticParams } from "./page";
import { getActiveCapabilities } from "@/lib/site";

test("generates static routes for active tools only", () => {
  const activeParams = getActiveCapabilities().map(({ slug }) => ({ slug }));
  expect(activeParams).toHaveLength(39);
  expect(generateStaticParams()).toEqual(activeParams);
});

test("emits metadata only for active tool routes", async () => {
  await expect(generateMetadata({ params: Promise.resolve({ slug: "merge-pdf" }) })).resolves.toMatchObject({
    title: "Merge PDF | Axel Tools",
  });
  await expect(generateMetadata({ params: Promise.resolve({ slug: "compress-pdf" }) })).resolves.toMatchObject({
    title: "Compress PDF | Axel Tools",
  });
  await expect(generateMetadata({ params: Promise.resolve({ slug: "compress-image" }) })).resolves.toMatchObject({
    title: "Compress Image | Axel Tools",
  });
  await expect(generateMetadata({ params: Promise.resolve({ slug: "scan-to-pdf" }) })).resolves.toEqual({});
  await expect(generateMetadata({ params: Promise.resolve({ slug: "barcode-generator" }) })).resolves.toEqual({});
});