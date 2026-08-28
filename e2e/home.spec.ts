import { expect, test } from "@playwright/test";

test("home page explains the privacy boundary", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/convert files locally/i);
  await expect(page.getByText(/files never leave your device/i)).toBeVisible();
});
