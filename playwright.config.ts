import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  webServer: {
    command: "npm run build && npx serve docs -l 4321",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://127.0.0.1:4321",
  },
});
