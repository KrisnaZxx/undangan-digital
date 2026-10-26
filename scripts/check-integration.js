// Pemeriksaan opsional pada database asli; hanya record unik milik pemeriksaan ini yang dibersihkan.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { getDatabase } from "../lib/db.js";
import { server } from "../server.js";

const sql = getDatabase();
const name = "Uji integrasi " + randomUUID();
const message = "Selamat! <b>Teks biasa</b> dan tanda kutip ' tetap aman.";
server.listen(0, "127.0.0.1");
await once(server, "listening");
const base = "http://127.0.0.1:" + server.address().port;
try {
  const rsvp = await fetch(base + "/api/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, attendance: "hadir", guests: 2 }),
  });
  assert.equal(rsvp.status, 201);
  const [saved] =
    await sql`SELECT attendance, guests FROM wedding_rsvps WHERE name = ${name}`;
  assert.deepEqual(saved, { attendance: "hadir", guests: 2 });

  const response = await fetch(base + "/api/wishes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, message }),
  });
  assert.equal(response.status, 201);
  const { wish } = await response.json();
  assert.equal(wish.message, message);
  const read = await fetch(base + "/api/wishes");
  assert.equal(read.status, 200);
  const { wishes } = await read.json();
  assert.ok(
    wishes.some((item) => item.id === wish.id && item.message === message),
  );
  assert.equal((await fetch(base + "/api/rsvp")).status, 405);
  console.log(
    "Integrasi lulus: RSVP tersimpan, ucapan tersimpan dan terbaca, RSVP tidak terbuka publik.",
  );
} finally {
  await sql.transaction([
    sql`DELETE FROM wedding_rsvps WHERE name = ${name}`,
    sql`DELETE FROM wedding_wishes WHERE name = ${name}`,
  ]);
  await new Promise((resolve) => server.close(resolve));
  console.log("Record uji integrasi sudah dibersihkan.");
}
