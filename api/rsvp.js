import { getDatabase } from "../lib/db.js";
import { validateGuest } from "../lib/validation.js";
import { prepareRequest, databaseError } from "../lib/http.js";

export default async function handler(req, res) {
  if (!prepareRequest(req, res, ["POST"])) return;
  const { value, error } = validateGuest(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const sql = getDatabase();
    const { name, attendance, guests } = value;
    await sql`INSERT INTO wedding_rsvps (name, attendance, guests) VALUES (${name}, ${attendance}, ${guests})`;
    return res
      .status(201)
      .json({
        message: "Terima kasih! Konfirmasi kehadiranmu sudah tersimpan.",
      });
  } catch {
    return databaseError(res);
  }
}
