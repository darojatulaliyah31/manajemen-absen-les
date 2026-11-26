import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  ShieldCheck,
  Search,
  AlertCircle,
  ClipboardCheck,
} from 'lucide-react';
import {
  formatDateIndo,
  formatDateTimeIndo,
  formatRupiah,
  getScheduleLifecycle,
} from '../utils/formatters';
import {
  LifecycleBadge,
  AttendanceDetailBadge,
  LbbMethodBadge,
  GFormLockBadge,
} from './StatusBadge';

export default function AttendanceView({
  data,
  onQuickAttend,
  onOpenAttendanceModal,
}) {
  const [tab, setTab] = useState('belum_absen');
  const [filterLbb, setFilterLbb] = useState('all');
  const [search, setSearch] = useState('');

  const lbbMap = Object.fromEntries(data.lbbs.map((l) => [l.id, l]));
  const studentMap = Object.fromEntries(data.students.map((s) => [s.id, s]));

  const belumAbsenCount = data.schedules.filter(
    (s) => getScheduleLifecycle(s).code === 'belum_absen'
  ).length;

  const gformQueueCount = data.schedules.filter((s) => {
    const lbb = lbbMap[s.lbbId];
    return (
      lbb?.attendanceMethod === 'google_form' &&
      !s.gformSubmitted &&
      !s.attendanceStatus &&
      getScheduleLifecycle(s).code === 'belum_absen'
    );
  }).length;

  const filtered = data.schedules
    .filter((sch) => {
      if (filterLbb !== 'all' && sch.lbbId !== filterLbb) return false;
      const life = getScheduleLifecycle(sch);
      const lbb = lbbMap[sch.lbbId];

      if (tab === 'belum_absen' && life.code !== 'belum_absen') return false;
      if (tab === 'sudah_absen' && life.code !== 'sudah_absen') return false;
      if (tab === 'akan_datang' && life.code !== 'akan_datang') return false;
      if (tab === 'gform_queue') {
        if (lbb?.attendanceMethod !== 'google_form' || sch.gformSubmitted || sch.attendanceStatus) {
          return false;
        }
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const stu = studentMap[sch.studentId];
      return (
        (stu?.name || '').toLowerCase().includes(q) ||
        (sch.subjectName || '').toLowerCase().includes(q) ||
        (lbb?.name || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  const tabs = [
    { id: 'belum_absen', label: `Belum Absen (${belumAbsenCount})` },
    { id: 'gform_queue', label: `Antrian Google Form (${gformQueueCount})` },
    { id: 'sudah_absen', label: 'Sudah Absen' },
    { id: 'akan_datang', label: 'Akan Datang' },
    { id: 'all', label: 'Semua Jadwal' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Manajemen Absensi</h2>
        <p className="text-sm text-slate-500">
          Jadwal lewat otomatis berstatus <strong>Belum Absen</strong> hingga diisi. LBB Google Form dilengkapi pengunci anti-double.
        </p>
      </div>

      {/* Info Banner Solusi Anti-Double Google Form */}
      <div className="flex items-start gap-3 rounded-2xl border border-purple-200 bg-purple-50/70 p-4 text-xs text-purple-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
        <div>
          <p className="font-bold">Cara Kerja Pelindung Anti-Double Google Form (Tanpa Ubah Pengaturan Form LBB):</p>
          <p className="mt-1 leading-relaxed text-purple-800">
            1) Buka tab <strong>Antrian Google Form</strong> untuk melihat jadwal yang belum diisi saja.{' '}
            2) Klik <strong>Isi & Kunci G-Form</strong>, salin data siap pakai, buka link Google Form, lalu tekan konfirmasi.{' '}
            3) Setelah dikonfirmasi, jadwal <strong>langsung terkunci (🔒)</strong> dan keluar dari antrian sehingga mustahil terisi dua kali. Sistem juga memperingatkan jika di hari & siswa yang sama sudah pernah mengisi G-Form.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              tab === t.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & LBB Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari siswa, mapel, atau nama LBB..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={filterLbb}
          onChange={(e) => setFilterLbb(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
        >
          <option value="all">Semua Lembaga LBB</option>
          {data.lbbs.map((lbb) => (
            <option key={lbb.id} value={lbb.id}>
              {lbb.name}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <ClipboardCheck className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
          <p className="text-sm font-semibold text-slate-700">Tidak ada jadwal di daftar ini</p>
          <p className="mt-1 text-xs text-slate-500">
            {tab === 'belum_absen'
              ? 'Semua jadwal yang sudah lewat sudah diisi absensinya.'
              : tab === 'gform_queue'
              ? 'Antrian Google Form bersih — tidak ada jadwal G-Form yang tertunda.'
              : 'Coba ubah filter pencarian atau tab di atas.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sch) => {
            const stu = studentMap[sch.studentId];
            const lbb = lbbMap[sch.lbbId];
            const isGform = lbb?.attendanceMethod === 'google_form';
            const life = getScheduleLifecycle(sch);

            return (
              <div
                key={sch.id}
                className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 shadow-xs transition sm:flex-row sm:items-center ${
                  life.code === 'belum_absen'
                    ? 'border-rose-200 bg-rose-50/30'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {formatDateIndo(sch.date, true)} • {sch.time}
                    </span>
                    <LifecycleBadge schedule={sch} />
                    <AttendanceDetailBadge status={sch.attendanceStatus} />
                    <GFormLockBadge schedule={sch} />
                  </div>

                  <p className="text-base font-bold text-slate-900">
                    {stu?.name || 'Siswa'}{' '}
                    <span className="text-sm font-normal text-slate-500">
                      ({stu?.grade || '-'})
                    </span>{' '}
                    — <span className="text-indigo-700">{sch.subjectName}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="font-medium">{lbb?.name || '-'}</span>
                    {lbb && <LbbMethodBadge method={lbb.attendanceMethod} />}
                    <span>•</span>
                    <span className="font-bold text-emerald-700">{formatRupiah(sch.fee)}</span>
                    {sch.gformSubmitted && sch.gformSubmittedAt && (
                      <>
                        <span>•</span>
                        <span className="text-teal-700">
                          G-Form diisi: {formatDateTimeIndo(sch.gformSubmittedAt)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  {!isGform && !sch.attendanceStatus && (
                    <button
                      onClick={() => onQuickAttend(sch.id, 'hadir')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Tandai Hadir
                    </button>
                  )}

                  {isGform && sch.gformSubmitted ? (
                    <button
                      onClick={() => onOpenAttendanceModal(sch)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-800 ring-1 ring-teal-300 hover:bg-teal-100"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Terkunci (Lihat Detail)
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenAttendanceModal(sch)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                        isGform
                          ? 'bg-purple-600 text-white shadow-xs hover:bg-purple-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isGform ? (
                        <>
                          <AlertCircle className="h-3.5 w-3.5" />
                          Isi & Kunci G-Form
                        </>
                      ) : sch.attendanceStatus ? (
                        'Ubah Status'
                      ) : (
                        'Pilih Status Lain'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
