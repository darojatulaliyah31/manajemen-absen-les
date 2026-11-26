import React, { useState } from 'react';
import { GraduationCap, Lock, Mail, Eye, EyeOff, ArrowRight, Database, HardDrive } from 'lucide-react';
import { loginTutor } from '../services/storage';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pinOrPassword, setPinOrPassword] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSupabaseConfigured) {
      if (!email.trim() || !pinOrPassword.trim()) {
        setError('Masukkan email dan password akun Tutor Supabase.');
        return;
      }
      setLoading(true);
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pinOrPassword,
        });
        if (authError) {
          setError('Email atau password Tutor salah. Periksa kembali akun di Supabase Auth.');
        } else {
          onLogin();
        }
      } catch {
        setError('Gagal terhubung ke server Supabase. Periksa koneksi internet Anda.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mode Lokal
    if (!pinOrPassword.trim()) {
      setError('Masukkan PIN / Password Tutor terlebih dahulu.');
      return;
    }
    const ok = loginTutor(pinOrPassword.trim(), remember);
    if (ok) {
      onLogin();
    } else {
      setError('PIN / Password salah. Coba periksa kembali.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">TutorTrack</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manajemen Absen, Jadwal & Fee Les Privat (Khusus Admin Tutor)
          </p>

          <div className="mt-3">
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <Database className="h-3.5 w-3.5" />
                Mode Cloud: Terhubung ke Supabase
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                <HardDrive className="h-3.5 w-3.5" />
                Mode Lokal (Browser)
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSupabaseConfigured && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email Admin Tutor
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tutor@emailanda.com"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {isSupabaseConfigured ? 'Password Akun Tutor' : 'Password / PIN Tutor'}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showSecret ? 'text' : 'password'}
                value={pinOrPassword}
                onChange={(e) => setPinOrPassword(e.target.value)}
                placeholder={
                  isSupabaseConfigured
                    ? 'Masukkan password Supabase Anda...'
                    : 'Masukkan PIN akses tutor...'
                }
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                autoFocus={!isSupabaseConfigured}
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title={showSecret ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Tetap masuk di browser ini
            </label>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Memeriksa akun...' : 'Masuk sebagai Tutor'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 ring-1 ring-slate-200/80">
          {isSupabaseConfigured ? (
            <>
              <p className="font-semibold text-slate-700">Autentikasi Aman Supabase:</p>
              <p className="mt-0.5">
                Masuk menggunakan akun email & password yang sudah Anda buat di menu{' '}
                <strong>Supabase Dashboard → Authentication → Users</strong>.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-700">Info Mode Lokal:</p>
              <p className="mt-0.5">
                Password default adalah{' '}
                <code className="rounded bg-white px-1.5 py-0.5 font-mono font-semibold text-indigo-600 ring-1 ring-slate-200">
                  tutor123
                </code>
                . Untuk beralih ke database cloud, isi file{' '}
                <code className="font-mono">.env</code> sesuai panduan Supabase.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
