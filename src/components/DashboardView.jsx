import React from 'react';
import {
  CalendarCheck,
  AlertTriangle,
  Wallet,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  formatRupiah,
  formatDateIndo,
  getTodayDateStr,
  getCurrentMonthKey,
  getMonthLabel,
  getWeekDates,
  getIndonesianDayName,
  getScheduleLifecycle,
} from '../utils/formatters';
import { LifecycleBadge, AttendanceDetailBadge, LbbMethodBadge, GFormLockBadge } from './StatusBadge';

export default function DashboardView({
  data,
  onNavigate,
  onQuickAttend,
  onOpenAttendanceModal,
}) {
  const todayStr = getTodayDateStr();
  const currentMonthKey = getCurrentMonthKey();
  const weekDates = getWeekDates(todayStr);

  const lbbMap = Object.fromEntries(data.lbbs.map((l) => [l.id, l]));
  const studentMap = Object.fromEntries(data.students.map((s) => [s.id, s]));

  const sortByDateTime = (a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);

  const todaySchedules = data.schedules
    .filter((s) => s.date === todayStr)
    .sort(sortByDateTime);

  const unrecordedSchedules = data.schedules
    .filter((s) => getScheduleLifecycle(s).code === 'belum_absen')
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  const monthSchedules = data.schedules.filter((s) =>
    s.date.startsWith(currentMonthKey)
  );

  const earnedFeeThisMonth = monthSchedules.reduce((sum, s) => {
    const life = getScheduleLifecycle(s);
    return life.countsFee ? sum + (Number(s.fee) || 0) : sum;
  }, 0);

  const attendedCountThisMonth = monthSchedules.filter(
    (s) => s.attendanceStatus === 'hadir'
  ).length;

  const estimatedRemainingFee = monthSchedules.reduce((sum, s) => {
    const life = getScheduleLifecycle(s);
    return life.code === 'akan_datang' || life.code === 'belum_absen'
      ? sum + (Number(s.fee) || 0)
      : sum;
  }, 0);

  // Rekap per LBB bulan ini
  const lbbBreakdown = data.lbbs.map((lbb) => {
    const lbbMonthSchedules = monthSchedules.filter((s) => s.lbbId === lbb.id);
    const earned = lbbMonthSchedules.reduce((sum, s) => {
      return s.attendanceStatus === 'hadir' ? sum + (Number(s.fee) || 0) : sum;
    }, 0);
    const hadirCount = lbbMonthSchedules.filter((s) => s.attendanceStatus === 'hadir').length;
    const payment = data.payments.find(
      (p) => p.monthKey === currentMonthKey && p.lbbId === lbb.id
    );
    return {
      lbb,
      earned,
      hadirCount,
      isPaid: payment?.status === 'paid',
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Tutor</h2>
          <p className="text-sm text-slate-500">
            Ringkasan jadwal hari ini ({formatDateIndo(todayStr, true)}), absensi tertunda, dan fee {getMonthLabel(currentMonthKey)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('schedules')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            Kelola Jadwal
          </button>
          <button
            onClick={() => onNavigate('attendance')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <ClipboardList className="h-4 w-4" />
            Isi Absensi ({unrecordedSchedules.length})
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Jadwal Hari Ini</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarCheck className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{todaySchedules.length} Sesi</p>
          <p className="mt-1 text-xs text-slate-500">
            {todaySchedules.filter((s) => s.attendanceStatus).length} sudah diabsen hari ini
          </p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-xs ${unrecordedSchedules.length > 0 ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Belum Diisi Absen</span>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${unrecordedSchedules.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle className="h-5 w-5" />
            </span>
          </div>
          <p className={`mt-3 text-3xl font-bold ${unrecordedSchedules.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {unrecordedSchedules.length} Sesi
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {unrecordedSchedules.length > 0
              ? 'Jadwal lewat menunggu input absensi'
              : 'Semua jadwal lewat sudah diabsen!'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Fee Terkonfirmasi ({getMonthLabel(currentMonthKey)})</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-700">{formatRupiah(earnedFeeThisMonth)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Dari {attendedCountThisMonth} pertemuan hadir • +Est. {formatRupiah(estimatedRemainingFee)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Siswa & LBB</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <CalendarDays className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{data.students.length} Siswa</p>
          <p className="mt-1 text-xs text-slate-500">
            Tersebar di {data.lbbs.length} lembaga LBB
          </p>
        </div>
      </div>

      {/* Main Grid: Today + Unrecorded + Monthly LBB Fee */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Jadwal Hari Ini */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Jadwal Mengajar Hari Ini</h3>
              <p className="text-xs text-slate-500">{formatDateIndo(todayStr, true)}</p>
            </div>
            <button
              onClick={() => onNavigate('schedules')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              + Tambah Jadwal
            </button>
          </div>

          {todaySchedules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
              <p className="text-sm font-medium text-slate-600">Tidak ada jadwal les hari ini.</p>
              <p className="mt-1 text-xs text-slate-400">
                Nikmati waktu luang Anda atau tambahkan jadwal di menu Jadwal Les.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedules.map((sch) => {
                const student = studentMap[sch.studentId];
                const lbb = lbbMap[sch.lbbId];
                const isGform = lbb?.attendanceMethod === 'google_form';
                return (
                  <div
                    key={sch.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-indigo-200 hover:bg-slate-50/60 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex min-w-[68px] flex-col items-center justify-center rounded-xl bg-indigo-50 px-2.5 py-2 text-indigo-700">
                        <Clock className="mb-0.5 h-3.5 w-3.5" />
                        <span className="text-sm font-bold">{sch.time}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {student?.name || 'Siswa Dihapus'}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({student?.grade || '-'})
                          </span>
                          <LifecycleBadge schedule={sch} />
                          <AttendanceDetailBadge status={sch.attendanceStatus} />
                          <GFormLockBadge schedule={sch} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className="font-medium text-indigo-700">{sch.subjectName}</span>
                          <span>•</span>
                          <span>{lbb?.name || '-'}</span>
                          {lbb && <LbbMethodBadge method={lbb.attendanceMethod} />}
                          <span>•</span>
                          <span className="font-semibold text-slate-800">{formatRupiah(sch.fee)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!sch.attendanceStatus && !isGform && (
                        <button
                          onClick={() => onQuickAttend(sch.id, 'hadir')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Hadir
                        </button>
                      )}
                      <button
                        onClick={() => onOpenAttendanceModal(sch)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        {sch.attendanceStatus ? 'Detail / Ubah' : isGform ? 'Absen G-Form' : 'Pilih Status'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rekap Fee Bulanan per LBB */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rekap Fee Bulan Ini</h3>
              <p className="text-xs text-slate-500">{getMonthLabel(currentMonthKey)}</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Detail <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mb-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
            <p className="text-xs font-medium text-emerald-100">Total Fee Hadir Bulan Ini</p>
            <p className="mt-1 text-2xl font-bold">{formatRupiah(earnedFeeThisMonth)}</p>
            <p className="mt-1 text-xs text-emerald-100">{attendedCountThisMonth} pertemuan selesai</p>
          </div>

          <div className="space-y-2.5">
            {lbbBreakdown.map(({ lbb, earned, hadirCount, isPaid }) => (
              <div
                key={lbb.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3"
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate text-sm font-semibold text-slate-800">{lbb.name}</p>
                  <p className="text-xs text-slate-500">{hadirCount}x hadir</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatRupiah(earned)}</p>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Jadwal Belum Diisi Absensinya */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Jadwal Lewat yang Belum Diisi Absensinya
            </h3>
            <p className="text-xs text-slate-500">
              Segera lengkapi absensi agar rekap fee bulanan akurat. Untuk LBB Google Form, gunakan pengunci anti-double.
            </p>
          </div>
          {unrecordedSchedules.length > 0 && (
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Buka Semua di Menu Absensi →
            </button>
          )}
        </div>

        {unrecordedSchedules.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>Mantap! Tidak ada jadwal yang tertinggal absensinya.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {unrecordedSchedules.slice(0, 6).map((sch) => {
              const student = studentMap[sch.studentId];
              const lbb = lbbMap[sch.lbbId];
              const isGform = lbb?.attendanceMethod === 'google_form';
              return (
                <div
                  key={sch.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/40 p-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-rose-700">
                        {formatDateIndo(sch.date, true)} • {sch.time}
                      </span>
                      <LifecycleBadge schedule={sch} />
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                      {student?.name || '-'} — {sch.subjectName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span>{lbb?.name || '-'}</span>
                      {lbb && <LbbMethodBadge method={lbb.attendanceMethod} />}
                      <span className="font-semibold text-slate-800">{formatRupiah(sch.fee)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    {!isGform && (
                      <button
                        onClick={() => onQuickAttend(sch.id, 'hadir')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Tandai Hadir
                      </button>
                    )}
                    <button
                      onClick={() => onOpenAttendanceModal(sch)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        isGform
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isGform ? 'Isi G-Form' : 'Opsi Lain'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Jadwal Les Minggu Ini */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Jadwal Les Minggu Ini (Senin – Minggu)</h3>
            <p className="text-xs text-slate-500">
              {formatDateIndo(weekDates[0])} s/d {formatDateIndo(weekDates[6])}
            </p>
          </div>
          <button
            onClick={() => onNavigate('schedules')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Lihat Semua Jadwal →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {weekDates.map((dateStr) => {
            const isToday = dateStr === todayStr;
            const daySchedules = data.schedules
              .filter((s) => s.date === dateStr)
              .sort((a, b) => a.time.localeCompare(b.time));

            return (
              <div
                key={dateStr}
                className={`flex flex-col rounded-xl border p-3 ${
                  isToday
                    ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-200'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div className="mb-2 flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div>
                    <p className={`text-xs font-bold ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>
                      {getIndonesianDayName(dateStr)}
                    </p>
                    <p className="text-[11px] text-slate-500">{formatDateIndo(dateStr)}</p>
                  </div>
                  {isToday && (
                    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      Hari Ini
                    </span>
                  )}
                </div>

                {daySchedules.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">Kosong</p>
                ) : (
                  <div className="space-y-2">
                    {daySchedules.map((sch) => {
                      const stu = studentMap[sch.studentId];
                      const life = getScheduleLifecycle(sch);
                      return (
                        <button
                          key={sch.id}
                          onClick={() => onOpenAttendanceModal(sch)}
                          className={`w-full rounded-lg border p-2 text-left transition hover:shadow-xs ${
                            life.code === 'sudah_absen'
                              ? 'border-emerald-200 bg-white'
                              : life.code === 'belum_absen'
                              ? 'border-rose-300 bg-rose-50/70'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700">
                            <span>{sch.time}</span>
                            <span
                              className={`h-2 w-2 rounded-full ${
                                life.code === 'sudah_absen'
                                  ? 'bg-emerald-500'
                                  : life.code === 'belum_absen'
                                  ? 'bg-rose-500'
                                  : 'bg-sky-500'
                              }`}
                              title={life.label}
                            />
                          </div>
                          <p className="mt-0.5 truncate text-xs font-semibold text-slate-900">
                            {stu?.name || '-'}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">{sch.subjectName}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
