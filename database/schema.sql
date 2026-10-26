-- Tabel khusus undangan ini, tidak mengubah tabel lain yang sudah ada.
CREATE TABLE IF NOT EXISTS wedding_rsvps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  attendance VARCHAR(5) NOT NULL CHECK (attendance IN ('hadir', 'tidak', 'ragu')),
  guests SMALLINT NOT NULL CHECK (guests BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((attendance = 'hadir' AND guests >= 1) OR (attendance <> 'hadir' AND guests = 0))
);

CREATE TABLE IF NOT EXISTS wedding_wishes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  message VARCHAR(500) NOT NULL CHECK (char_length(trim(message)) BETWEEN 3 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
