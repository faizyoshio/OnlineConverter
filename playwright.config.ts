import { defineConfig, devices } from "@playwright/test";

const testPort = 3100;

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: `http://127.0.0.1:${testPort}`,
  },
  webServer: {
    command: `npm run build && npm run start -- --port ${testPort}`,
    env: { CATALOG_PREVIEW: "1" },
    url: `http://127.0.0.1:${testPort}`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
