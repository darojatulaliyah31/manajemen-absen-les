import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Lock,
  Unlock,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import {
  ATTENDANCE_OPTIONS,
  formatDateIndo,
  formatDateTimeIndo,
  formatRupiah,
} from '../utils/formatters';
import { LifecycleBadge, LbbMethodBadge } from './StatusBadge';

export default function AttendanceModal({
  schedule,
  student,
  lbb,
  allSchedules,
  onClose,
  onSaveAttendance,
}) {
  const [copied, setCopied] = useState(false);
  const [emergencyUnlocked, setEmergencyUnlocked] = useState(false);
  const [noteInput, setNoteInput] = useState(schedule?.notes || '');

  if (!schedule) return null;

  const isGform = lbb?.attendanceMethod === 'google_form';
  const isWebsite = lbb?.attendanceMethod === 'website';
  const isLocked = isGform && schedule.gformSubmitted && !emergencyUnlocked;

  // Deteksi apakah ada jadwal lain di tanggal, siswa, dan LBB yang sama yang sudah isi G-Form
  const sameDayGformDuplicates = isGform
    ? allSchedules.filter(
        (s) =>
          s.id !== schedule.id &&
          s.date === schedule.date &&
          s.studentId === schedule.studentId &&
          s.lbbId === schedule.lbbId &&
          s.gformSubmitted
      )
    : [];

  const copySummaryText = `Tanggal: ${formatDateIndo(schedule.date, true)}\nWaktu: ${schedule.time}\nSiswa: ${student?.name || '-'}\nMapel: ${schedule.subjectName}\nLBB: ${lbb?.name || '-'}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(copySummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectStatus = (statusValue, markGform = false) => {
    onSaveAttendance(schedule.id, {
      attendanceStatus: statusValue,
      attendanceUpdatedAt: new Date().toISOString(),
      gformSubmitted: markGform ? true : statusValue === 'hadir' ? schedule.gformSubmitted : false,
      gformSubmittedAt: markGform
        ? new Date().toISOString()
        : statusValue === 'hadir'
        ? schedule.gformSubmittedAt
        : null,
      notes: noteInput.trim(),
    });
    onClose();
  };

  const handleResetAttendance = () => {
    onSaveAttendance(schedule.id, {
      attendanceStatus: null,
      attendanceUpdatedAt: null,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: noteInput.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Manajemen Absensi</h3>
            <p className="text-xs text-slate-500">
              {formatDateIndo(schedule.date, true)} • Pukul {schedule.time} WIB
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Ringkas Sesi */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-base font-bold text-slate-900">
                {student?.name || 'Siswa'} — {schedule.subjectName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span>{lbb?.name || '-'}</span>
                {lbb && <LbbMethodBadge method={lbb.attendanceMethod} />}
                <span className="font-bold text-emerald-700">{formatRupiah(schedule.fee)}</span>
              </div>
            </div>
            <LifecycleBadge schedule={schedule} />
          </div>
        </div>

        {/* KHUSUS GOOGLE FORM: Anti-Double Submit Guard */}
        {isGform && (
          <div className="mb-5 space-y-3 rounded-2xl border border-purple-200 bg-purple-50/50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-purple-900">
              <ShieldCheck className="h-5 w-5 text-purple-700" />
              Pelindung Anti-Double Google Form
            </div>

            {sameDayGformDuplicates.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <p className="font-bold">PERINGATAN POTENSI DOUBLE!</p>
                  <p className="mt-0.5">
                    Anda sudah pernah mengisi Google Form untuk{' '}
                    <strong>{student?.name}</strong> pada tanggal{' '}
                    <strong>{formatDateIndo(schedule.date)}</strong> (jam{' '}
                    {sameDayGformDuplicates.map((d) => d.time).join(', ')}). Pastikan ini memang sesi berbeda sebelum mengisi lagi.
                  </p>
                </div>
              </div>
            )}

            {isLocked ? (
              <div className="rounded-xl border border-teal-300 bg-teal-50 p-3.5">
                <div className="flex items-center gap-2 text-sm font-bold text-teal-900">
                  <Lock className="h-4 w-4 text-teal-700" />
                  Google Form Terkunci (Sudah Diisi)
                </div>
                <p className="mt-1 text-xs text-teal-800">
                  Anda menandai sudah mengirim Google Form pada{' '}
                  <strong>{formatDateTimeIndo(schedule.gformSubmittedAt)}</strong>. Tombol buka Google Form dikunci agar tidak terisi dua kali.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Yakin ingin membuka kunci? Lakukan hanya jika sebelumnya salah pencet dan belum benar-benar mengirim Google Form.'
                      )
                    ) {
                      setEmergencyUnlocked(true);
                    }
                  }}
                  className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-300 hover:bg-teal-100"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Buka Kunci Darurat
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-white p-3 ring-1 ring-purple-200">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Data Siap Salin ke Google Form
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Tersalin!' : 'Salin Data'}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700">
                    {copySummaryText}
                  </pre>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {lbb?.attendanceUrl ? (
                    <a
                      href={lbb.attendanceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-purple-700 ring-1 ring-purple-300 transition hover:bg-purple-100"
                    >
                      1. Buka Google Form LBB
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <div className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
                      Link Google Form belum diisi di Data LBB.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSelectStatus('hadir', true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-purple-700"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    2. Sudah Kirim & Kunci (Hadir)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Link Website LBB jika tipe Website */}
        {isWebsite && lbb?.attendanceUrl && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs">
            <span className="font-medium text-blue-900">
              LBB ini menggunakan absensi via Website tersendiri:
            </span>
            <a
              href={lbb.attendanceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-700"
            >
              Buka Web LBB
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Pilihan Status Kehadiran */}
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold text-slate-700">
            {isGform
              ? 'Atau pilih status lain jika kelas tidak berlangsung:'
              : 'Pilih Status Kehadiran:'}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ATTENDANCE_OPTIONS.filter((opt) => !(isGform && opt.value === 'hadir' && !isLocked)).map(
              (opt) => {
                const isSelected = schedule.attendanceStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectStatus(opt.value, isGform && opt.value === 'hadir')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : opt.value === 'hadir'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.value === 'hadir' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {opt.label}
                  </button>
                );
              }
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Catatan: Fee dihitung masuk ke rekap pendapatan hanya jika berstatus <strong>Hadir</strong>.
          </p>
        </div>

        {/* Catatan */}
        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Catatan Pertemuan (Opsional)
          </label>
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Materi yang diajarkan atau alasan izin/reschedule..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          {schedule.attendanceStatus ? (
            <button
              type="button"
              onClick={handleResetAttendance}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Reset ke Belum Absen
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
