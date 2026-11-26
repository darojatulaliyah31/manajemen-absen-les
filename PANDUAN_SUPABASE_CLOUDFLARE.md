# Panduan Lengkap Pemula: Integrasi Supabase & Hosting di Cloudflare Pages

Panduan ini disusun khusus untuk pemula di bidang IT agar website **TutorTrack (Manajemen Absen Les)** Anda bisa terhubung ke database cloud **Supabase** (gratis) dan online 24 jam melalui **Cloudflare Pages** (gratis) tanpa perlu menyewa server/VPS.

---

## Bagian 1: Menyiapkan Database di Supabase (Gratis)

### Langkah 1.1 — Buat Proyek Supabase
1. Buka [https://supabase.com](https://supabase.com) lalu klik **Start your project** (login menggunakan akun GitHub atau email Anda).
2. Klik **New Project**.
3. Isi:
   - **Name**: `manajemen-absen-les`
   - **Database Password**: buat password yang kuat (simpan di catatan Anda).
   - **Region**: pilih **Southeast Asia (Singapore)** agar akses dari Indonesia paling cepat.
4. Klik **Create new project** dan tunggu ± 1–2 menit sampai status proyek aktif.

### Langkah 1.2 — Buat Tabel Database Otomatis
1. Di menu sebelah kiri Supabase Dashboard, klik **SQL Editor**.
2. Klik **+ New query**.
3. Buka file `supabase/schema.sql` di folder proyek Anda, salin **seluruh isinya**, lalu tempel ke SQL Editor Supabase.
4. Klik tombol **Run** (pojok kanan bawah).
5. Pastikan muncul pesan sukses (`Success. No rows returned`).
   > Perintah SQL ini otomatis membuat 5 tabel (`lbbs`, `students`, `student_subjects`, `schedules`, `lbb_payments`) lengkap dengan keamanan **Row Level Security (RLS)** agar data hanya bisa dibuka oleh Tutor yang sudah login.

### Langkah 1.3 — Buat Akun Login Khusus Admin (Tutor)
Karena aplikasi ini hanya boleh diakses oleh Anda (Tutor):
1. Di menu sebelah kiri Supabase, klik **Authentication** → **Users**.
2. Klik **Add user** → **Create new user**.
3. Masukkan **Email** dan **Password** yang ingin Anda pakai untuk login ke aplikasi, centang **Auto Confirm User**, lalu klik **Create user**.
4. Agar orang lain di internet tidak bisa mendaftar akun baru:
   - Masih di menu **Authentication**, klik **Sign In / Providers** (atau **User Signups**).
   - Matikan opsi **Allow new users to sign up** → klik **Save**.

### Langkah 1.4 — Ambil Kunci API Supabase
1. Di menu kiri bawah Supabase, klik **Project Settings** (ikon roda gigi) → **API** (atau **Data API**).
2. Salin 2 nilai berikut:
   - **Project URL** (contoh: `https://abcdefghijkl.supabase.co`)
   - **Project API Keys → `anon` `public`** (teks panjang berawalan `eyJ...`)

---

## Bagian 2: Menguji Koneksi Supabase di Komputer Lokal

1. Buka folder proyek Anda: `C:\Users\Darojatul Aliyah\.gemini\antigravity\scratch\manajemen-absen-les`
2. Salin file `.env.example` menjadi file baru bernama **`.env`** (tanpa `.example`).
3. Buka file `.env` dengan Notepad atau VS Code, lalu isi dengan kunci dari Langkah 1.4:
   ```env
   VITE_SUPABASE_URL=https://abcdefghijkl.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Di terminal PowerShell, jalankan ulang server lokal agar file `.env` terbaca:
   ```powershell
   cd "C:\Users\Darojatul Aliyah\.gemini\antigravity\scratch\manajemen-absen-les"
   npm run dev
   ```
5. Buka `http://localhost:5173`. Halaman login sekarang otomatis menampilkan badge **Mode Cloud: Terhubung ke Supabase**!
6. Login memakai Email & Password Tutor yang Anda buat di Langkah 1.3.
7. *(Opsional)* Jika sebelumnya Anda sudah mengisi data di mode lokal, klik tombol **"Upload Data Lokal ke Supabase"** yang muncul di Dashboard / menu Pengaturan agar seluruh data lama Anda langsung pindah ke Supabase!

---

## Bagian 3: Hosting Online di Cloudflare Pages (Gratis)

Anda dapat memilih **Cara A (Direct Upload — paling cepat tanpa GitHub)** atau **Cara B (Via GitHub — otomatis update setiap kali kode berubah)**.

### Cara A: Direct Upload (Paling Mudah untuk Pemula)
1. Pastikan file `.env` sudah terisi di komputer Anda (Langkah Bagian 2).
2. Jalankan perintah build di PowerShell:
   ```powershell
   cd "C:\Users\Darojatul Aliyah\.gemini\antigravity\scratch\manajemen-absen-les"
   npm run build
   ```
   Perintah ini akan mengemas seluruh aplikasi + konfigurasi Supabase ke dalam folder **`dist`**.
3. Buka [https://dash.cloudflare.com](https://dash.cloudflare.com) (daftar gratis jika belum punya akun).
4. Di menu kiri, pilih **Workers & Pages** → klik **Create** → pilih tab **Pages** → klik **Upload assets** (Direct Upload).
5. Beri nama proyek (misalnya `absen-les-tutor`), lalu seret/upload seluruh folder **`dist`** tadi.
6. Klik **Deploy site**. Selesai! Website Anda langsung aktif di alamat HTTPS seperti `https://absen-les-tutor.pages.dev`.

### Cara B: Deploy Lewat GitHub (Direkomendasikan untuk Jangka Panjang)
1. Upload folder proyek ke repository GitHub Anda (catatan: file `.env` tidak ikut terupload demi kerapian, cukup kode sumbernya).
2. Di **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**, pilih repository tersebut.
3. Isi pengaturan build:
   - **Framework preset**: `Vite` (atau `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Klik **Environment variables (advanced)** dan tambahkan 2 variabel berikut:
   - `VITE_SUPABASE_URL` = URL proyek Supabase Anda
   - `VITE_SUPABASE_ANON_KEY` = `anon` key Supabase Anda
5. Klik **Save and Deploy**.

---

## Catatan Tambahan Keamanan di Supabase Setelah Online
Setelah website Anda online di `https://nama-web-anda.pages.dev`:
1. Buka **Supabase Dashboard → Authentication → URL Configuration**.
2. Isi **Site URL** dengan alamat Cloudflare Pages Anda (`https://nama-web-anda.pages.dev`).
3. Simpan perubahan. Sekarang aplikasi manajemen absen les Anda siap dipakai dari HP maupun laptop di mana saja!
