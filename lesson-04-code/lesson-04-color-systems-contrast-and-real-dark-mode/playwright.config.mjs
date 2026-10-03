import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  // One worker: the broken-pair test edits a token file the server watches.
  workers: 1,
  fullyParallel: false,
  use: { baseURL: "http://localhost:4100", ...devices["Desktop Chrome"] },
  webServer: {
    command: "node apps/control-tower/server/serve.mjs",
    url: "http://localhost:4100/api/contrast",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
