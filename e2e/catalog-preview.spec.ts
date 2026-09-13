import { expect, test } from "@playwright/test";

test("keeps all planned tools visible, noninteractive, and responsive in catalog preview", async ({ page }) => {
  await page.goto("/");

  const search = page.getByRole("searchbox", { name: "Search tools" });
  const allTools = page.getByRole("button", { name: "All tools" });
  await expect(page.getByRole("status")).toHaveText("77 tools");

  await search.fill("Rotate PDF");
  await expect(page.getByRole("status")).toHaveText("1 tool");
  const card = page.locator(".tool-card").filter({ has: page.getByRole("heading", { name: "Rotate PDF" }) });
  await expect(card.getByText("In development")).toBeVisible();
  await expect(card.locator("a")).toHaveCount(0);

  const route = await page.goto("/tools/rotate-pdf");
  expect(route?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();

  const barcodeRoute = await page.goto("/tools/barcode-generator");
  expect(barcodeRoute?.status()).toBe(404);

  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(search).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(allTools).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
