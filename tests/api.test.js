import test from "node:test";
import assert from "node:assert/strict";
import rsvp from "../api/rsvp.js";
import wishes from "../api/wishes.js";

function response() {
  return {
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

test("RSVP tidak menyediakan endpoint baca data tamu", async () => {
  const res = response();
  await rsvp({ method: "GET", headers: {} }, res);
  assert.equal(res.code, 405);
  assert.equal(res.headers.Allow, "POST");
});

test("validasi terjadi sebelum koneksi database", async () => {
  for (const handler of [rsvp, wishes]) {
    const res = response();
    await handler(
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: {},
      },
      res,
    );
    assert.equal(res.code, 400);
  }
});

test("jenis konten, permintaan lintas situs, dan ukuran input diperiksa", async () => {
  for (const [headers, body, code] of [
    [{ "content-type": "text/plain" }, {}, 415],
    [
      { "content-type": "application/json", "sec-fetch-site": "cross-site" },
      {},
      403,
    ],
    [{ "content-type": "application/json" }, { name: "a".repeat(9000) }, 413],
  ]) {
    const res = response();
    await rsvp({ method: "POST", headers, body }, res);
    assert.equal(res.code, code);
  }
});

test("kegagalan konfigurasi tidak membocorkan kredensial", async () => {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "";
  try {
    const res = response();
    await wishes({ method: "GET", headers: {}, query: {} }, res);
    assert.equal(res.code, 503);
    assert.equal(res.headers["Cache-Control"], "no-store");
    assert.ok(!JSON.stringify(res.body).includes("DATABASE_URL"));
  } finally {
    if (previous !== undefined) process.env.DATABASE_URL = previous;
    else delete process.env.DATABASE_URL;
  }
});
