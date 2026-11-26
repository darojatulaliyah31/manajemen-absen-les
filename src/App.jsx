import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  CalendarDays,
  Users,
  Wallet,
  BarChart3,
  Settings,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Database,
  HardDrive,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import {
  loadAppData,
  saveAppData,
  resetToSeedData,
  isTutorLoggedIn,
  logoutTutor,
} from './services/storage';
import { createSeedData } from './data/seedData';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import {
  fetchAllFromSupabase,
  upsertLbbRemote,
  deleteLbbRemote,
  upsertStudentRemote,
  deleteStudentRemote,
  upsertScheduleRemote,
  bulkInsertSchedulesRemote,
  deleteScheduleRemote,
  upsertPaymentRemote,
  importDatasetToSupabase,
} from './services/dataRepository';
import { generateId, getScheduleLifecycle } from './utils/formatters';
import LoginScreen from './components/LoginScreen';
import DashboardView from './components/DashboardView';
import StudentsView from './components/StudentsView';
import SchedulesView from './components/SchedulesView';
import AttendanceView from './components/AttendanceView';
import LbbPaymentsView from './components/LbbPaymentsView';
import MonthlyReportView from './components/MonthlyReportView';
import SettingsGuideView from './components/SettingsGuideView';
import AttendanceModal from './components/AttendanceModal';

const EMPTY_DATA = { lbbs: [], students: [], schedules: [], payments: [] };

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() =>
    isSupabaseConfigured ? false : isTutorLoggedIn()
  );
  const [authChecking, setAuthChecking] = useState(() => isSupabaseConfigured);
  const [tutorEmail, setTutorEmail] = useState('');
  const [data, setData] = useState(() =>
    isSupabaseConfigured ? EMPTY_DATA : loadAppData()
  );
  const [loadingData, setLoadingData] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attendanceModalScheduleId, setAttendanceModalScheduleId] = useState(null);

  const loadSupabaseData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoadingData(true);
    setSyncError('');
    try {
      const remoteData = await fetchAllFromSupabase();
      if (remoteData) setData(remoteData);
    } catch (err) {
      setSyncError(
        `Gagal memuat data Supabase: ${err.message || 'Periksa tabel schema.sql & RLS'}`
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Cek sesi Supabase Auth saat aplikasi dibuka
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: sessionData }) => {
      const user = sessionData?.session?.user || null;
      setLoggedIn(Boolean(user));
      setTutorEmail(user?.email || '');
      setAuthChecking(false);
      if (user) {
        loadSupabaseData();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setLoggedIn(Boolean(user));
      setTutorEmail(user?.email || '');
      if (user) {
        loadSupabaseData();
      } else {
        setData(EMPTY_DATA);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [loadSupabaseData]);

  // Simpan otomatis ke localStorage hanya saat Mode Lokal
  useEffect(() => {
    if (!isSupabaseConfigured) {
      saveAppData(data);
    }
  }, [data]);

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
          <span className="text-sm font-medium text-slate-700">
            Menghubungkan ke Supabase...
          </span>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  const runRemote = async (fn) => {
    if (!isSupabaseConfigured) return;
    setSyncError('');
    try {
      await fn();
    } catch (err) {
      setSyncError(`Gagal menyimpan ke Supabase: ${err.message || 'Terjadi kesalahan'}`);
      loadSupabaseData();
    }
  };

  const belumAbsenCount = data.schedules.filter(
    (s) => getScheduleLifecycle(s).code === 'belum_absen'
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'attendance',
      label: 'Absensi',
      icon: ClipboardCheck,
      badge: belumAbsenCount > 0 ? belumAbsenCount : null,
    },
    { id: 'schedules', label: 'Jadwal Les', icon: CalendarDays },
    { id: 'students', label: 'Siswa & LBB', icon: Users },
    { id: 'payments', label: 'Pembayaran LBB', icon: Wallet },
    { id: 'reports', label: 'Laporan Bulanan', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan & Panduan', icon: Settings },
  ];

  // Handlers (Hybrid Lokal & Supabase)
  const handleSaveStudent = (studentObj) => {
    setData((prev) => {
      const exists = prev.students.some((s) => s.id === studentObj.id);
      return {
        ...prev,
        students: exists
          ? prev.students.map((s) => (s.id === studentObj.id ? studentObj : s))
          : [...prev.students, studentObj],
      };
    });
    runRemote(() => upsertStudentRemote(studentObj));
  };

  const handleDeleteStudent = (stuId) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== stuId),
      schedules: isSupabaseConfigured
        ? prev.schedules.filter((s) => s.studentId !== stuId)
        : prev.schedules,
    }));
    runRemote(() => deleteStudentRemote(stuId));
  };

  const handleSaveLbb = (lbbObj) => {
    setData((prev) => {
      const exists = prev.lbbs.some((l) => l.id === lbbObj.id);
      return {
        ...prev,
        lbbs: exists
          ? prev.lbbs.map((l) => (l.id === lbbObj.id ? lbbObj : l))
          : [...prev.lbbs, lbbObj],
      };
    });
    runRemote(() => upsertLbbRemote(lbbObj));
  };

  const handleDeleteLbb = (lbbId) => {
    setData((prev) => ({
      ...prev,
      lbbs: prev.lbbs.filter((l) => l.id !== lbbId),
    }));
    runRemote(() => deleteLbbRemote(lbbId));
  };

  const handleSaveSchedule = (schObj) => {
    setData((prev) => {
      const exists = prev.schedules.some((s) => s.id === schObj.id);
      return {
        ...prev,
        schedules: exists
          ? prev.schedules.map((s) => (s.id === schObj.id ? schObj : s))
          : [...prev.schedules, schObj],
      };
    });
    runRemote(() => upsertScheduleRemote(schObj));
  };

  const handleDeleteSchedule = (schId) => {
    setData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((s) => s.id !== schId),
    }));
    runRemote(() => deleteScheduleRemote(schId));
  };

  const handleReschedule = (oldSch, newDate, newTime, keepHistory) => {
    if (!keepHistory) {
      const updated = { ...oldSch, date: newDate, time: newTime };
      setData((prev) => ({
        ...prev,
        schedules: prev.schedules.map((s) => (s.id === oldSch.id ? updated : s)),
      }));
      runRemote(() => upsertScheduleRemote(updated));
      return;
    }

    const updatedOld = {
      ...oldSch,
      attendanceStatus: 'reschedule',
      attendanceUpdatedAt: new Date().toISOString(),
      notes: oldSch.notes
        ? `${oldSch.notes} (Reschedule ke ${newDate} ${newTime})`
        : `Reschedule ke ${newDate} ${newTime}`,
    };
    const replacement = {
      ...oldSch,
      id: generateId('sch'),
      date: newDate,
      time: newTime,
      attendanceStatus: null,
      attendanceUpdatedAt: null,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: `Pengganti jadwal ${oldSch.date} ${oldSch.time}`,
    };

    setData((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules.map((s) => (s.id === oldSch.id ? updatedOld : s)),
        replacement,
      ],
    }));
    runRemote(() => bulkInsertSchedulesRemote([updatedOld, replacement]));
  };

  const handleBulkAddSchedules = (newSchedules) => {
    setData((prev) => ({
      ...prev,
      schedules: [...prev.schedules, ...newSchedules],
    }));
    runRemote(() => bulkInsertSchedulesRemote(newSchedules));
  };

  const handleQuickAttend = (scheduleId, statusValue) => {
    const target = data.schedules.find((s) => s.id === scheduleId);
    if (!target) return;
    const updated = {
      ...target,
      attendanceStatus: statusValue,
      attendanceUpdatedAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => (s.id === scheduleId ? updated : s)),
    }));
    runRemote(() => upsertScheduleRemote(updated));
  };

  const handleSaveAttendance = (scheduleId, updates) => {
    const target = data.schedules.find((s) => s.id === scheduleId);
    if (!target) return;
    const updated = { ...target, ...updates };
    setData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => (s.id === scheduleId ? updated : s)),
    }));
    runRemote(() => upsertScheduleRemote(updated));
  };

  const handleSavePayment = (paymentObj) => {
    setData((prev) => {
      const idx = prev.payments.findIndex(
        (p) => p.monthKey === paymentObj.monthKey && p.lbbId === paymentObj.lbbId
      );
      if (idx >= 0) {
        const next = [...prev.payments];
        next[idx] = paymentObj;
        return { ...prev, payments: next };
      }
      return { ...prev, payments: [...prev.payments, paymentObj] };
    });
    runRemote(() => upsertPaymentRemote(paymentObj));
  };

  const handleImportDataset = async (dataset) => {
    if (isSupabaseConfigured) {
      setLoadingData(true);
      try {
        await importDatasetToSupabase(dataset);
        await loadSupabaseData();
      } catch (err) {
        setSyncError(`Gagal upload ke Supabase: ${err.message}`);
      } finally {
        setLoadingData(false);
      }
    } else {
      setData(dataset);
    }
  };

  const handleMigrateLocalToSupabase = async () => {
    const localData = loadAppData();
    await handleImportDataset(localData);
  };

  const handleSeedDemo = async () => {
    if (isSupabaseConfigured) {
      await handleImportDataset(createSeedData());
    } else {
      setData(resetToSeedData());
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      logoutTutor();
    }
    setLoggedIn(false);
  };

  const modalSchedule = attendanceModalScheduleId
    ? data.schedules.find((s) => s.id === attendanceModalScheduleId)
    : null;
  const modalStudent = modalSchedule
    ? data.students.find((s) => s.id === modalSchedule.studentId)
    : null;
  const modalLbb = modalSchedule
    ? data.lbbs.find((l) => l.id === modalSchedule.lbbId)
    : null;

  const isRemoteEmpty =
    isSupabaseConfigured &&
    !loadingData &&
    data.lbbs.length === 0 &&
    data.students.length === 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Desktop */}
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">TutorTrack</h1>
            <p className="text-[11px] text-slate-500">Admin Tutor Privat</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-indigo-50 font-semibold text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.label}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-slate-100 p-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px]">
            {isSupabaseConfigured ? (
              <div className="flex items-center justify-between text-emerald-700">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Database className="h-3.5 w-3.5" />
                  Supabase Cloud
                </span>
                <button
                  onClick={loadSupabaseData}
                  title="Sinkronkan ulang"
                  className="rounded p-1 hover:bg-emerald-100"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingData ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                <HardDrive className="h-3.5 w-3.5" />
                Mode Lokal (Browser)
              </span>
            )}
            {tutorEmail && (
              <p className="mt-0.5 truncate text-[10px] text-slate-500">{tutorEmail}</p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <header className="no-print flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-900">TutorTrack</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="no-print border-b border-slate-200 bg-white p-3 lg:hidden">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium ${
                      active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {syncError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
              {syncError}
            </div>
          )}

          {loadingData && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-xs font-medium text-indigo-700">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Memuat & menyinkronkan data dari Supabase...
            </div>
          )}

          {isRemoteEmpty && (
            <div className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-indigo-950">
                  Database Supabase Anda Masih Kosong
                </p>
                <p className="text-xs text-indigo-800">
                  Anda dapat langsung memindahkan data uji coba dari browser lokal ke Supabase, atau mengisi data contoh awal.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleMigrateLocalToSupabase}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload Data Lokal ke Supabase
                </button>
                <button
                  onClick={handleSeedDemo}
                  className="rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50"
                >
                  Isi Data Contoh Awal
                </button>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              data={data}
              onNavigate={setActiveTab}
              onQuickAttend={handleQuickAttend}
              onOpenAttendanceModal={(sch) => setAttendanceModalScheduleId(sch.id)}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              data={data}
              onQuickAttend={handleQuickAttend}
              onOpenAttendanceModal={(sch) => setAttendanceModalScheduleId(sch.id)}
            />
          )}

          {activeTab === 'schedules' && (
            <SchedulesView
              data={data}
              onSaveSchedule={handleSaveSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onReschedule={handleReschedule}
              onBulkAddSchedules={handleBulkAddSchedules}
              onOpenAttendanceModal={(sch) => setAttendanceModalScheduleId(sch.id)}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              data={data}
              onSaveStudent={handleSaveStudent}
              onDeleteStudent={handleDeleteStudent}
              onSaveLbb={handleSaveLbb}
              onDeleteLbb={handleDeleteLbb}
            />
          )}

          {activeTab === 'payments' && (
            <LbbPaymentsView data={data} onSavePayment={handleSavePayment} />
          )}

          {activeTab === 'reports' && <MonthlyReportView data={data} />}

          {activeTab === 'settings' && (
            <SettingsGuideView
              data={data}
              tutorEmail={tutorEmail}
              onImportData={handleImportDataset}
              onMigrateLocalToSupabase={handleMigrateLocalToSupabase}
              onResetDemo={handleSeedDemo}
            />
          )}
        </main>
      </div>

      {/* Shared Attendance Modal */}
      {modalSchedule && (
        <AttendanceModal
          schedule={modalSchedule}
          student={modalStudent}
          lbb={modalLbb}
          allSchedules={data.schedules}
          onClose={() => setAttendanceModalScheduleId(null)}
          onSaveAttendance={handleSaveAttendance}
        />
      )}
    </div>
  );
}
