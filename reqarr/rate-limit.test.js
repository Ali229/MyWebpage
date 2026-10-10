import test from "node:test";
import assert from "node:assert/strict";
import {app} from "./server.js";

test("status route aliases share a limit before authentication without consuming download requests", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (let index = 0; index < 120; index++) {
      const path = index % 2 === 0 ? "/download/status" : "/reqarr/download/status";
      const response = await fetch(base + path, {method: "POST"});
      assert.equal(response.status, 401);
      await response.arrayBuffer();
    }
    for (const path of ["/download/status", "/reqarr/download/status"]) {
      const response = await fetch(base + path, {method: "POST"});
      assert.equal(response.status, 429);
      assert.ok(response.headers.get("retry-after"));
      assert.match((await response.json()).error, /status requests/);
    }
    const download = await fetch(base + "/download/tv", {method: "POST"});
    assert.equal(download.status, 401);
    await download.arrayBuffer();
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
