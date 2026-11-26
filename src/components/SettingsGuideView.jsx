import React, { useState } from 'react';
import {
  KeyRound,
  Download,
  Upload,
  RotateCcw,
  Database,
  Cloud,
  CheckCircle2,
  UploadCloud,
  HardDrive,
} from 'lucide-react';
import { getTutorPin, setTutorPin } from '../services/storage';
import { isSupabaseConfigured } from '../services/supabaseClient';

export default function SettingsGuideView({
  data,
  tutorEmail,
  onImportData,
  onMigrateLocalToSupabase,
  onResetDemo,
}) {
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [migrating, setMigrating] = useState(false);

  const handlePinChange = (e) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setPinMsg('PIN minimal 4 karakter.');
      return;
    }
    setTutorPin(newPin.trim());
    setNewPin('');
    setPinMsg('PIN / Password Tutor berhasil diperbarui!');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-absen-les-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.lbbs || !parsed.students || !parsed.schedules) {
          alert('Format file JSON tidak valid.');
          return;
        }
        await onImportData(parsed);
        alert(
          isSupabaseConfigured
            ? 'Data JSON berhasil diunggah dan disimpan ke Supabase!'
            : 'Backup data lokal berhasil dipulihkan!'
        );
      } catch {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleMigrateClick = async () => {
    if (
      !window.confirm(
        'Upload seluruh data dari penyimpanan lokal browser ke database Supabase sekarang?'
      )
    ) {
      return;
    }
    setMigrating(true);
    try {
      await onMigrateLocalToSupabase();
      alert('Migrasi data lokal ke Supabase berhasil!');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Pengaturan & Panduan Supabase + Cloudflare</h2>
        <p className="text-sm text-slate-500">
          Status koneksi database, backup/migrasi data, dan langkah integrasi ke Supabase serta hosting Cloudflare Pages.
        </p>
      </div>

      {/* Status Koneksi */}
      <div
        className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${
          isSupabaseConfigured
            ? 'border-emerald-200 bg-emerald-50/60'
            : 'border-amber-200 bg-amber-50/60'
        }`}
      >
        <div className="flex items-start gap-3">
          {isSupabaseConfigured ? (
            <Database className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
          ) : (
            <HardDrive className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
          )}
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isSupabaseConfigured
                ? 'Terhubung ke Database Supabase (Cloud PostgreSQL)'
                : 'Sedang Berjalan di Mode Lokal (Browser)'}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              {isSupabaseConfigured
                ? `Login sebagai Admin Tutor: ${tutorEmail || '-'}. Semua perubahan otomatis tersimpan ke cloud Supabase.`
                : 'Data saat ini tersimpan di localStorage browser. Untuk menyambungkan ke Supabase, buat file .env sesuai panduan di bawah.'}
            </p>
          </div>
        </div>

        {isSupabaseConfigured && (
          <button
            onClick={handleMigrateClick}
            disabled={migrating}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
          >
            <UploadCloud className="h-4 w-4" />
            {migrating ? 'Mengunggah...' : 'Migrasi Data Lokal ke Supabase'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Keamanan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Keamanan Akses Admin (Tutor)</h3>
          </div>

          {isSupabaseConfigured ? (
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                Aplikasi menggunakan <strong>Supabase Auth</strong> +{' '}
                <strong>Row Level Security (RLS)</strong>. Hanya akun Tutor yang Anda buat di Supabase Dashboard yang bisa login dan melihat data.
              </p>
              <p className="rounded-xl bg-slate-50 p-3 text-slate-700 ring-1 ring-slate-200">
                Untuk mengganti password akun Tutor, buka{' '}
                <strong>Supabase Dashboard → Authentication → Users</strong> lalu pilih akun Anda dan klik <em>Reset Password</em>.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs text-slate-500">
                PIN Mode Lokal saat ini:{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{getTutorPin()}</code>
              </p>
              <form onSubmit={handlePinChange} className="flex gap-2">
                <input
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Masukkan PIN baru (min. 4 huruf/angka)"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Simpan PIN
                </button>
              </form>
              {pinMsg && <p className="mt-2 text-xs font-semibold text-emerald-700">{pinMsg}</p>}
            </>
          )}
        </div>

        {/* Backup & Restore */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="mb-2 text-base font-bold text-slate-900">Backup & Restore Data (.json)</h3>
          <p className="mb-4 text-xs text-slate-500">
            Download seluruh data LBB, siswa, jadwal, absensi, dan pembayaran ke file JSON atau pulihkan kembali kapan saja.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download Backup (.json)
            </button>

            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              <Upload className="h-4 w-4 text-indigo-600" />
              Restore dari JSON
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Isi ulang data contoh demo awal? Data dengan ID yang sama akan ditimpa.'
                  )
                ) {
                  onResetDemo();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
            >
              <RotateCcw className="h-4 w-4" />
              Isi Data Contoh
            </button>
          </div>
        </div>
      </div>

      {/* Roadmap Pemula: Lokal -> Supabase -> Cloudflare Pages */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900">
          Roadmap Pemula: Supabase + Hosting Cloudflare Pages
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Dengan Supabase, Anda <strong>tidak perlu menyewa VPS atau membuat server backend terpisah</strong>. Ikuti langkah lengkap di file{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
            PANDUAN_SUPABASE_CLOUDFLARE.md
          </code>
          .
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              1. Buat Proyek & Tabel Supabase
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Daftar gratis di <strong>supabase.com</strong>, buka <strong>SQL Editor</strong>, lalu salin-tempel isi file{' '}
              <code className="font-mono">supabase/schema.sql</code> dan klik <strong>Run</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-900">
              <Database className="h-5 w-5 text-indigo-600" />
              2. Buat Akun Tutor & Isi .env
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Buat 1 akun Tutor di <strong>Authentication → Users</strong>, matikan Sign-up publik, lalu salin{' '}
              <code className="font-mono">Project URL</code> &amp; <code className="font-mono">anon key</code> ke file{' '}
              <code className="font-mono">.env</code>.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Cloud className="h-5 w-5 text-amber-600" />
              3. Deploy ke Cloudflare Pages
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Upload ke GitHub / jalankan <code className="font-mono">npm run build</code>, hubungkan ke{' '}
              <strong>Cloudflare Pages</strong>, isi <em>Environment Variables</em> Supabase, dan website langsung online!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
