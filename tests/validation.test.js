import test from "node:test";
import assert from "node:assert/strict";
import { validateGuest } from "../lib/validation.js";

test("nama dirapikan, jumlah tamu hadir dipertahankan", () => {
  assert.deepEqual(
    validateGuest({ name: "  Budi Santoso  ", attendance: "hadir", guests: 2 })
      .value,
    { name: "Budi Santoso", attendance: "hadir", guests: 2 },
  );
});

test("jumlah tamu tidak hadir atau belum pasti selalu nol", () => {
  for (const attendance of ["tidak", "ragu"])
    assert.equal(
      validateGuest({ name: "Budi", attendance, guests: 3 }).value.guests,
      0,
    );
});

test("input rusak, nama kosong, status palsu, dan jumlah tamu di luar batas ditolak", () => {
  for (const body of [
    null,
    [],
    "x",
    {},
    { name: " " },
    { name: "a".repeat(81), attendance: "hadir", guests: 1 },
    { name: "Budi", attendance: "palsu", guests: 1 },
    ...[-1, 0, 6, 1.5, "2", null].map((guests) => ({
      name: "Budi",
      attendance: "hadir",
      guests,
    })),
  ]) {
    assert.ok(validateGuest(body).error, JSON.stringify(body));
  }
});

test("ucapan dibatasi dan dipertahankan sebagai teks", () => {
  assert.deepEqual(
    validateGuest({ name: "  Sari ", message: " Selamat ya! " }, true).value,
    { name: "Sari", message: "Selamat ya!" },
  );
  for (const message of ["", "  ", "ab", "x".repeat(501), 123])
    assert.ok(validateGuest({ name: "Sari", message }, true).error);
  assert.equal(
    validateGuest({ name: "Sari", message: "<script>alert(1)</script>" }, true)
      .value.message,
    "<script>alert(1)</script>",
  );
});
