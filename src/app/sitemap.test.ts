import { expect, test } from "vitest";
import sitemap from "./sitemap";

test("includes home and only active capabilities", () => {
  expect(sitemap()).toEqual([{ url: "http://localhost:3000/" }]);
});
