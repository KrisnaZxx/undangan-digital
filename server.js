// Server lokal; di Vercel, file api/*.js dijalankan sebagai Functions.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import rsvp from "./api/rsvp.js";
import wishes from "./api/wishes.js";
import { getDatabase } from "./lib/db.js";

const root = resolve("public");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};
const handlers = { "/api/rsvp": rsvp, "/api/wishes": wishes };

export const server = createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    const url = new URL(req.url, "http://localhost");
    if (handlers[url.pathname]) {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 8192) {
          res.writeHead(413).end("Data terlalu besar.");
          return;
        }
      }
      try {
        req.body = body ? JSON.parse(body) : undefined;
      } catch {
        res
          .writeHead(400, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "JSON tidak valid." }));
        return;
      }
      req.query = Object.fromEntries(url.searchParams);
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      };
      await handlers[url.pathname](req, res);
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405).end();
      return;
    }
    const path = resolve(
      root,
      "." +
        decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname),
    );
    if (!path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    const file = await readFile(path);
    res.writeHead(200, {
      "Content-Type": mime[extname(path)] || "application/octet-stream",
    });
    res.end(req.method === "HEAD" ? undefined : file);
  } catch (error) {
    res
      .writeHead(error.code === "ENOENT" ? 404 : 500)
      .end("Halaman tidak tersedia.");
  }
});

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.filename)
) {
  server.listen(Number(process.env.PORT) || 3000, "127.0.0.1", async () => {
    console.log(`Undangan siap: http://localhost:${server.address().port}`);
    try {
      await getDatabase().query("SELECT 1");
      console.log("PostgreSQL Neon terhubung.");
    } catch {
      console.error(
        "PostgreSQL belum terhubung. Periksa config/database.local.json atau DATABASE_URL.",
      );
    }
  });
}
