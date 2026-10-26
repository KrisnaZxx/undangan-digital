# Naya & Arga: A Love Worth Watching

Undangan pernikahan fiktif bergaya layanan streaming, dibuat dengan HTML, CSS, Bootstrap 5, JavaScript, Node.js, dan PostgreSQL Neon. Tidak memakai framework frontend atau halaman admin.

## Menjalankan lokal

Gunakan Node.js 22 atau lebih baru:

```powershell
npm install
npm run dev
```

Buka http://localhost:3000. Konfigurasi database lokal sudah disiapkan di `config/database.local.json`, jadi `npm run dev` langsung dapat menggunakan Neon tanpa perintah environment tambahan. Restart server setelah mengganti konfigurasi. Bootstrap, Bootstrap Icons, gambar, dan musik disajikan dari proyek ini; Google Maps membutuhkan internet.

## Konfigurasi PostgreSQL tanpa file .env

Untuk lokal, ubah `connectionString` di `config/database.local.json` sesuai host, user, password, dan database yang diinginkan. File ini berada di luar `public/`, dikecualikan melalui `.gitignore` dan `.vercelignore`, dan tidak boleh dibagikan. Untuk clone baru, salin `config/database.example.json` menjadi `config/database.local.json`, lalu isi koneksinya.

```powershell
npm run db:setup
npm run dev
```

Jika `DATABASE_URL` tersedia pada environment proses, nilainya diprioritaskan dibanding konfigurasi lokal. Contoh penggantian untuk satu sesi PowerShell:

```powershell
$env:DATABASE_URL = 'CONNECTION_STRING_POSTGRESQL_KAMU'
npm run db:setup
npm run dev
```

Jangan commit atau membagikan connection string. Gunakan koneksi SSL Neon. `db:setup` membuat `wedding_rsvps` dan `wedding_wishes` secara idempoten; tidak menghapus data atau tabel lain. Alternatifnya, jalankan `database/schema.sql` melalui SQL Editor Neon.

## Deployment Vercel

1. Import repository ke Vercel, pilih Framework Preset **Other**.
2. Output Directory: `public`. Tidak perlu build command; `vercel.json` menyertakan pengaturan proyek.
3. Tambahkan `DATABASE_URL` di Settings → Environment Variables, untuk environment deployment yang dibutuhkan. Tidak perlu file `.env`.
4. Pastikan `database/schema.sql` sudah dijalankan di Neon.
5. Deploy. Vercel menjalankan `/api/rsvp.js` dan `/api/wishes.js` sebagai Node.js Functions; `server.js` hanya untuk pengembangan lokal.
6. Uji konfirmasi, kirim ucapan, lalu refresh untuk memastikan ucapan tetap tersimpan.

Jika memakai connection string terpisah per lingkungan, jalankan schema pada masing-masing database. Untuk deployment sebenarnya, ganti password yang pernah dibagikan, gunakan role database dengan hak seperlunya, dan aktifkan perlindungan spam di platform bila endpoint mulai menerima penyalahgunaan.

## Peta source untuk penjelasan

| File | Tanggung jawab |
| --- | --- |
| `public/index.html` | Struktur dan semua data acara fiktif |
| `public/assets/css/style.css` | Tema, layout Bootstrap tambahan, responsif, reduced motion |
| `public/assets/js/script.js` | Pembuka, musik, navigasi, countdown, formulir, daftar ucapan, salin rekening |
| `api/rsvp.js` | POST konfirmasi kehadiran; tidak mengekspos daftar RSVP |
| `api/wishes.js` | GET ucapan dengan pagination dan POST ucapan baru |
| `lib/db.js` | Koneksi Neon dari environment Vercel atau konfigurasi lokal |
| `config/database.example.json` | Contoh konfigurasi lokal tanpa kredensial |
| `lib/validation.js` | Validasi server untuk nama, kehadiran, jumlah tamu, dan ucapan |
| `lib/http.js` | Batas metode, tipe/ukuran input, dan respons kesalahan |
| `database/schema.sql` | Tabel dan constraint PostgreSQL |
| `server.js` | Server pengembangan memakai modul bawaan Node.js |
| `tests/` | Pengujian validasi, proteksi API, dan server lokal |

## Alur data

Browser → JavaScript `fetch` → API Node.js → validasi → query PostgreSQL berparameter → respons JSON → tampilan.

RSVP berisi nama, status, jumlah tamu, dan waktu. Ucapan berisi nama, pesan, dan waktu; nama dan pesan tampil publik. Kedua formulir terpisah, tanpa mengumpulkan nomor telepon atau email. RSVP tidak bisa dibaca melalui endpoint publik. Ucapan pengunjung ditampilkan memakai `textContent` untuk mencegah HTML tersisip dijalankan.

## Mengganti isi undangan

- Nama, orang tua, cerita, lokasi, dress code, serta rekening: ubah langsung di `public/index.html`.
- Tanggal hitung mundur: ubah `weddingDate` di `public/assets/js/script.js`, selalu sertakan zona `+07:00` untuk WIB.
- Gambar: ganti file di `public/assets/images/` dengan nama yang sama, atau ubah referensinya di HTML/CSS.
- Musik: ganti file audio dan URL pada elemen `<audio>`.
- Rekening BCA 10 digit dan Mandiri 13 digit dibuat secara acak untuk data fiktif. Nomor acak tidak terverifikasi sebagai rekening pasangan; jangan digunakan untuk transfer. Ganti teks rekening, nama pemilik, dan atribut `data-account` sekaligus sebelum digunakan sungguhan.
- Pernikahan: Sabtu, **23 Januari 2027**, 08.00 WIB. Batas konfirmasi: **16 Januari 2027**.
- Pasangan, keluarga, dan acara adalah fiktif. Venue menggunakan lokasi nyata JW Marriott Hotel Surabaya, Jl. Embong Malang No. 85–89, Surabaya, Jawa Timur 60261. Peta menunjuk langsung ke hotel; foto tetap ilustrasi pernikahan dan bukan dokumentasi hotel atau bukti reservasi.
- Di ponsel, empat episode cerita disusun vertikal agar seluruh isi dapat dibaca lewat scroll biasa.

## Verifikasi

```powershell
npm test
```

Mencakup batas input, jumlah tamu nol jika tidak hadir, metode API, penolakan lintas situs, kegagalan database tanpa kebocoran, dan akses file publik. Pengujian unit tidak memerlukan database dan tidak menulis data tamu.

Dengan konfigurasi lokal atau `DATABASE_URL`, `npm run test:integration` memeriksa alur simpan dan baca melalui API ke PostgreSQL. Perintah ini membuat record unik untuk pengujian dan membersihkannya kembali, tanpa menyentuh record pengunjung.

## Aset

- Foto `couple.jpg`, `bride.jpg`, `groom.jpg`, `story.jpg`, `journey.jpg`, `details.jpg`, `venue.jpg` direvisi menggunakan ImageGen bawaan dengan gaya fotografi dokumenter natural, cahaya mendung Bandung, dan tekstur asli. Brief disimpan di `ASSETS.md`.
- `our-forever.wav`: komposisi instrumental sintetis asli sepanjang 40 detik, dibuat oleh `node scripts/create-music.js`, bukan rekaman lagu komersial.
- Bootstrap 5.3 dan Bootstrap Icons: distribusi lokal beserta lisensi MIT di `public/assets/vendor/`. Ikon memakai font library, tanpa gambar SVG buatan sendiri di HTML/JS/CSS proyek.

Belum mencakup login/admin, upload pengunjung, nama tamu melalui URL, kalender, atau galeri layar penuh. Belum ada moderasi atau pembatasan laju terdistribusi; endpoint ucapan publik memerlukan perlindungan tambahan jika dipakai untuk audiens besar.
