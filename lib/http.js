export function prepareRequest(req, res, methods) {
  res.setHeader("Cache-Control", "no-store");
  if (!methods.includes(req.method)) {
    res.setHeader("Allow", methods.join(", "));
    res.status(405).json({ error: "Metode tidak diizinkan." });
    return false;
  }
  if (req.method === "POST") {
    if (
      req.headers["content-type"]?.split(";")[0].trim().toLowerCase() !==
      "application/json"
    ) {
      res.status(415).json({ error: "Gunakan format application/json." });
      return false;
    }
    if (req.headers["sec-fetch-site"] === "cross-site") {
      res
        .status(403)
        .json({ error: "Permintaan dari situs lain tidak diizinkan." });
      return false;
    }
    if (Buffer.byteLength(JSON.stringify(req.body ?? null)) > 8192) {
      res.status(413).json({ error: "Data formulir terlalu besar." });
      return false;
    }
  }
  return true;
}

export function databaseError(res) {
  // Jangan kirim detail koneksi atau pesan PostgreSQL ke pengunjung.
  res.status(503).json({
    error: "Buku tamu belum dapat diakses. Silakan coba beberapa saat lagi.",
  });
}
