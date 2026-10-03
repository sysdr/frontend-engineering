// Lesson 3 end-to-end checks run against the real dev server (pnpm dev),
// on its own port so a dashboard you already have open is left alone.
import { defineConfig } from "@playwright/test";

const PORT = 4180;

export default defineConfig({
  testDir: "e2e",
  timeout: 60000,
  workers: 1,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}`, viewport: { width: 1440, height: 1000 } },
  webServer: {
    command: `node apps/control-tower/server/serve.mjs`,
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}/api/tower`,
    reuseExistingServer: false,
    timeout: 60000,
  },
});
