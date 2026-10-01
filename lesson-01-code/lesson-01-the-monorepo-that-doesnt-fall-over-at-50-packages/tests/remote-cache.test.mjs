import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createCacheServer, DEV_TOKEN } from "../scripts/remote-cache-server.mjs";

let base;
let server;
let stats;
const auth = { authorization: `Bearer ${DEV_TOKEN}` };

beforeAll(async () => {
  ({ server, stats } = createCacheServer({ dir: mkdtempSync(join(tmpdir(), "pulse-rc-")), log: () => {} }));
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
afterAll(() => new Promise((r) => server.close(r)));

describe("remote cache server (turbo's /v8/artifacts API)", () => {
  it("rejects requests without the team token", async () => {
    const res = await fetch(`${base}/v8/artifacts/status`);
    expect(res.status).toBe(401);
  });

  it("reports caching as enabled", async () => {
    const res = await fetch(`${base}/v8/artifacts/status`, { headers: auth });
    expect(await res.json()).toEqual({ status: "enabled" });
  });

  it("misses, then stores, then serves the exact same bytes", async () => {
    const miss = await fetch(`${base}/v8/artifacts/abc123`, { method: "HEAD", headers: auth });
    expect(miss.status).toBe(404);

    const payload = Buffer.from("tarball-bytes-from-turbo");
    const put = await fetch(`${base}/v8/artifacts/abc123`, { method: "PUT", headers: auth, body: payload });
    expect(put.status).toBe(202);

    const head = await fetch(`${base}/v8/artifacts/abc123`, { method: "HEAD", headers: auth });
    expect(head.status).toBe(200);
    const get = await fetch(`${base}/v8/artifacts/abc123`, { headers: auth });
    expect(Buffer.from(await get.arrayBuffer()).equals(payload)).toBe(true);
    expect(stats).toMatchObject({ uploads: 1, hits: 1 });
  });

  it("answers turbo's batch existence query", async () => {
    const res = await fetch(`${base}/v8/artifacts`, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({ hashes: ["abc123", "nothere"] }),
    });
    const body = await res.json();
    expect(body.abc123).toEqual({ size: 24 });
    expect(body.nothere).toBeNull();
  });
});
