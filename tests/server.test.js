import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { server } from "../server.js";

test("server lokal menyajikan frontend dan melindungi source backend", async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const page = await fetch(base);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Naya &amp; Arga|Naya & Arga/);
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)].map(
      (match) => match[1],
    );
    for (const asset of new Set(assets))
      assert.equal((await fetch(base + asset)).status, 200, asset);
    assert.equal((await fetch(base + "/lib/db.js")).status, 404);
    assert.equal((await fetch(base + "/package.json")).status, 404);
    assert.equal(
      (await fetch(base + "/config/database.local.json")).status,
      404,
    );
    for (const file of ["bootstrap-icons.woff2", "bootstrap-icons.woff"]) {
      assert.equal(
        (await fetch(base + "/assets/vendor/bootstrap-icons/fonts/" + file))
          .status,
        200,
      );
    }
    const invalid = await fetch(base + "/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(invalid.status, 400);
    assert.equal((await fetch(base + "/api/rsvp")).status, 405);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
