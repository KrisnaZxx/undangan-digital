import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getDatabase } from "../lib/db.js";

test("tanggal undangan, countdown, rekening, peta, dan library ikon konsisten", async () => {
  const html = await readFile(
    new URL("../public/index.html", import.meta.url),
    "utf8",
  );
  const script = await readFile(
    new URL("../public/assets/js/script.js", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../public/assets/css/style.css", import.meta.url),
    "utf8",
  );
  const config = JSON.parse(
    await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  );
  assert.match(html, /18 September 2027/);
  assert.match(html, /18\.09\.2027/);
  assert.match(script, /2027-09-18T08:00:00\+07:00/);
  assert.ok(!html.includes("2026"));
  const accounts = [...html.matchAll(/data-account="(\d+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(
    accounts.map((number) => number.length),
    [10, 13],
  );
  const displayed = [...html.matchAll(/class="account-number">([\d ]+)</g)].map(
    (match) => match[1].replaceAll(" ", ""),
  );
  assert.deepEqual(displayed, accounts);
  assert.match(html, /<iframe[\s\S]*?title="Google Maps[\s\S]*?output=embed/);
  assert.match(html, /maps\?q=JW%20Marriott%20Hotel%20Surabaya/);
  assert.match(
    config.headers[0].headers.find(
      (header) => header.key === "Content-Security-Policy",
    ).value,
    /frame-src https:\/\/www\.google\.com/,
  );
  assert.match(html, /bootstrap-icons\.min\.css/);
  assert.ok(!/<svg|<symbol|<use\b/.test(html));
  assert.ok(!css.includes("data:image/svg"));
});

test("di Vercel, koneksi tidak mengambil kredensial lokal", () => {
  const originalUrl = process.env.DATABASE_URL;
  const originalVercel = process.env.VERCEL;
  delete process.env.DATABASE_URL;
  process.env.VERCEL = "1";
  try {
    assert.throws(() => getDatabase(), /DATABASE_URL/);
  } finally {
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  }
});
