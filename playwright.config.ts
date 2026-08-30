import { defineConfig } from "@playwright/test";

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
    reuseExistingServer: false,
  },
  projects: [
    { name: "chromium" },
    { name: "firefox" },
    { name: "webkit" },
  ],
});
