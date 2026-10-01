// End-to-end proof for Lesson 2: a real browser, a real server, a real build.
// Port 4173 so it never collides with a `pnpm dev` you left running on 4100.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4173", ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
  webServer: {
    command: "node apps/control-tower/server/serve.mjs",
    env: { PORT: "4173" },
    url: "http://localhost:4173/api/tower",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
