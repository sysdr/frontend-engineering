import { defineConfig, devices } from "@playwright/test";

// The e2e suite runs against the real dev server on its own port, so it never
// collides with a `pnpm dev` you already have open on 4100.
const PORT = 4199;

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
  webServer: {
    command: "node apps/control-tower/server/serve.mjs",
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
