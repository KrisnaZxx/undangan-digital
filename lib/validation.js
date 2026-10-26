export function validateGuest(body, withMessage = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Data formulir tidak valid." };
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 80)
    return { error: "Nama harus berisi 2–80 karakter." };

  if (withMessage) {
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (message.length < 3 || message.length > 500)
      return { error: "Ucapan harus berisi 3–500 karakter." };
    return { value: { name, message } };
  }

  const { attendance, guests } = body;
  if (!["hadir", "tidak", "ragu"].includes(attendance))
    return { error: "Pilih konfirmasi kehadiran yang valid." };
  if (!Number.isInteger(guests) || guests < 0 || guests > 5)
    return { error: "Jumlah tamu harus antara 0 dan 5." };
  if (attendance === "hadir" && guests < 1)
    return { error: "Isi minimal 1 tamu untuk konfirmasi hadir." };
  return {
    value: { name, attendance, guests: attendance === "hadir" ? guests : 0 },
  };
}
