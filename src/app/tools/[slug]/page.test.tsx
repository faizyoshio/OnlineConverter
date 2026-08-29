import { expect, test } from "vitest";
import { generateMetadata, generateStaticParams } from "./page";

test("generates no static tool routes while all capabilities are planned", () => {
  expect(generateStaticParams()).toEqual([]);
});

test("does not emit metadata for planned tool routes", async () => {
  await expect(generateMetadata({ params: Promise.resolve({ slug: "merge-pdf" }) })).resolves.toEqual({});
});
