import { getDatabase } from "../lib/db.js";
import { validateGuest } from "../lib/validation.js";
import { prepareRequest, databaseError } from "../lib/http.js";

export default async function handler(req, res) {
  if (!prepareRequest(req, res, ["GET", "POST"])) return;
  const validation =
    req.method === "POST" ? validateGuest(req.body, true) : null;
  if (validation?.error)
    return res.status(400).json({ error: validation.error });

  try {
    const sql = getDatabase();
    if (req.method === "GET") {
      const cursor = Number(req.query?.before);
      const before =
        Number.isSafeInteger(cursor) && cursor > 0 ? cursor : 2147483647;
      const rows =
        await sql`SELECT id, name, message, created_at FROM wedding_wishes WHERE id < ${before} ORDER BY id DESC LIMIT 13`;
      const wishes = rows.slice(0, 12);
      return res
        .status(200)
        .json({
          wishes,
          nextCursor: rows.length > 12 ? wishes.at(-1).id : null,
        });
    }

    const { name, message } = validation.value;
    const [wish] =
      await sql`INSERT INTO wedding_wishes (name, message) VALUES (${name}, ${message}) RETURNING id, name, message, created_at`;
    return res
      .status(201)
      .json({ wish, message: "Doa baikmu sudah tersimpan. Terima kasih!" });
  } catch {
    return databaseError(res);
  }
}
