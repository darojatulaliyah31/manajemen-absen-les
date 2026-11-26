import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Wand2,
  X,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  formatRupiah,
  formatDateIndo,
  getIndonesianDayName,
  getTodayDateStr,
  parseLocalDate,
  toDateStr,
  generateId,
  getScheduleLifecycle,
} from '../utils/formatters';
import {
  LifecycleBadge,
  AttendanceDetailBadge,
  LbbMethodBadge,
  GFormLockBadge,
} from './StatusBadge';

export default function SchedulesView({
  data,
  onSaveSchedule,
  onDeleteSchedule,
  onReschedule,
  onBulkAddSchedules,
  onOpenAttendanceModal,
}) {
  const [search, setSearch] = useState('');
  const [filterLbb, setFilterLbb] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Add/Edit Schedule Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [date, setDate] = useState(getTodayDateStr());
  const [time, setTime] = useState('16:00');
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [customFee, setCustomFee] = useState(null);

  // Reschedule Modal
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [keepRescheduleHistory, setKeepRescheduleHistory] = useState(true);

  // Generator Modal
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genStartDate, setGenStartDate] = useState(getTodayDateStr());
  const [genWeeks, setGenWeeks] = useState(2);

  const lbbMap = Object.fromEntries(data.lbbs.map((l) => [l.id, l]));
  const studentMap = Object.fromEntries(data.students.map((s) => [s.id, s]));

  // Derive auto-filled values from selected student & subject
  const selectedStudent = studentMap[studentId] || null;
  const selectedLbb = selectedStudent ? lbbMap[selectedStudent.lbbId] : null;
  const selectedSubject =
    selectedStudent?.subjects?.find((sub) => sub.id === subjectId) ||
    selectedStudent?.subjects?.[0] ||
    null;
  const autoFee = customFee !== null ? customFee : selectedSubject?.fee || 0;

  const openAddModal = () => {
    const firstStu = data.students[0];
    setEditingSchedule(null);
    setDate(getTodayDateStr());
    setTime('16:00');
    setStudentId(firstStu?.id || '');
    setSubjectId(firstStu?.subjects?.[0]?.id || '');
    setCustomFee(null);
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (sch) => {
    setEditingSchedule(sch);
    setDate(sch.date);
    setTime(sch.time);
    setStudentId(sch.studentId);
    setSubjectId(sch.subjectId);
    setCustomFee(sch.fee);
    setNotes(sch.notes || '');
    setModalOpen(true);
  };

  const handleStudentChange = (newStuId) => {
    setStudentId(newStuId);
    const stu = studentMap[newStuId];
    setSubjectId(stu?.subjects?.[0]?.id || '');
    setCustomFee(null);
  };

  const handleSubjectChange = (newSubId) => {
    setSubjectId(newSubId);
    setCustomFee(null);
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!date || !time || !selectedStudent || !selectedSubject) return;

    onSaveSchedule({
      id: editingSchedule?.id || generateId('sch'),
      date,
      time,
      studentId: selectedStudent.id,
      lbbId: selectedStudent.lbbId,
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      fee: Number(autoFee) || 0,
      attendanceStatus: editingSchedule?.attendanceStatus || null,
      attendanceUpdatedAt: editingSchedule?.attendanceUpdatedAt || null,
      gformSubmitted: editingSchedule?.gformSubmitted || false,
      gformSubmittedAt: editingSchedule?.gformSubmittedAt || null,
      notes: notes.trim(),
    });
    setModalOpen(false);
  };

  const openRescheduleModal = (sch) => {
    setRescheduleTarget(sch);
    setNewDate(sch.date);
    setNewTime(sch.time);
    setKeepRescheduleHistory(true);
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!rescheduleTarget || !newDate || !newTime) return;
    onReschedule(rescheduleTarget, newDate, newTime, keepRescheduleHistory);
    setRescheduleTarget(null);
  };

  // Preview generated schedules
  const buildGeneratedSchedules = () => {
    const start = parseLocalDate(genStartDate);
    const totalDays = Number(genWeeks) * 7;
    const existingKeys = new Set(
      data.schedules.map((s) => `${s.date}|${s.time}|${s.studentId}|${s.subjectId}`)
    );

    const created = [];
    for (let offset = 0; offset < totalDays; offset++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + offset);
      const dayOfWeek = cur.getDay();
      const dateStr = toDateStr(cur);

      data.students.forEach((stu) => {
        stu.subjects.forEach((sub) => {
          (sub.weeklySchedules || []).forEach((slot) => {
            if (Number(slot.dayOfWeek) === dayOfWeek) {
              const key = `${dateStr}|${slot.time}|${stu.id}|${sub.id}`;
              if (!existingKeys.has(key)) {
                existingKeys.add(key);
                created.push({
                  id: generateId('sch'),
                  date: dateStr,
                  time: slot.time,
                  studentId: stu.id,
                  lbbId: stu.lbbId,
                  subjectId: sub.id,
                  subjectName: sub.name,
                  fee: Number(sub.fee) || 0,
                  attendanceStatus: null,
                  attendanceUpdatedAt: null,
                  gformSubmitted: false,
                  gformSubmittedAt: null,
                  notes: 'Dibuat otomatis dari jadwal mingguan',
                });
              }
            }
          });
        });
      });
    }
    return created.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  };

  const previewGenerated = genModalOpen ? buildGeneratedSchedules() : [];

  const filteredSchedules = data.schedules
    .filter((sch) => {
      if (filterLbb !== 'all' && sch.lbbId !== filterLbb) return false;
      const life = getScheduleLifecycle(sch);
      if (filterStatus !== 'all' && life.code !== filterStatus) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const stu = studentMap[sch.studentId];
      const lbb = lbbMap[sch.lbbId];
      return (
        (stu?.name || '').toLowerCase().includes(q) ||
        (sch.subjectName || '').toLowerCase().includes(q) ||
        (lbb?.name || '').toLowerCase().includes(q) ||
        sch.date.includes(q)
      );
    })
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Jadwal Les & Reschedule</h2>
          <p className="text-sm text-slate-500">
            Cukup pilih tanggal, waktu, dan nama siswa — lembaga, mapel, dan fee otomatis terisi dari database siswa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGenModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <Wand2 className="h-4 w-4 text-purple-600" />
            Generate Jadwal Mingguan
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Jadwal
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama siswa, mapel, LBB, atau tanggal..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={filterLbb}
          onChange={(e) => setFilterLbb(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
        >
          <option value="all">Semua LBB</option>
          {data.lbbs.map((lbb) => (
            <option key={lbb.id} value={lbb.id}>
              {lbb.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
        >
          <option value="all">Semua Status</option>
          <option value="akan_datang">Akan Datang</option>
          <option value="belum_absen">Belum Absen</option>
          <option value="sudah_absen">Sudah Absen</option>
        </select>
      </div>

      {/* Schedule Table / List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {filteredSchedules.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Tidak ada jadwal yang sesuai filter. Klik "Tambah Jadwal" atau "Generate Jadwal Mingguan".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Hari, Tanggal & Waktu</th>
                  <th className="px-4 py-3">Siswa & Mapel</th>
                  <th className="px-4 py-3">Lembaga LBB</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((sch) => {
                  const stu = studentMap[sch.studentId];
                  const lbb = lbbMap[sch.lbbId];
                  return (
                    <tr key={sch.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">
                          {formatDateIndo(sch.date, true)}
                        </p>
                        <p className="text-xs font-medium text-indigo-600">Pukul {sch.time} WIB</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">{stu?.name || 'Siswa Dihapus'}</p>
                        <p className="text-xs text-slate-600">
                          {sch.subjectName} {stu?.grade ? `• ${stu.grade}` : ''}
                        </p>
                        {sch.notes && (
                          <p className="mt-0.5 text-[11px] text-slate-400">{sch.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-slate-800">{lbb?.name || '-'}</p>
                        {lbb && (
                          <div className="mt-1">
                            <LbbMethodBadge method={lbb.attendanceMethod} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-800">
                        {formatRupiah(sch.fee)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <LifecycleBadge schedule={sch} />
                          <AttendanceDetailBadge status={sch.attendanceStatus} />
                          <GFormLockBadge schedule={sch} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onOpenAttendanceModal(sch)}
                            className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                          >
                            Absen
                          </button>
                          <button
                            onClick={() => openRescheduleModal(sch)}
                            className="rounded-lg p-1.5 text-violet-600 hover:bg-violet-50"
                            title="Reschedule Jadwal"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(sch)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                            title="Edit Jadwal"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Hapus jadwal ini?')) {
                                onDeleteSchedule(sch.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Jadwal (Auto-fill LBB, Mapel, Fee) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingSchedule ? 'Edit Jadwal Les' : 'Tambah Jadwal Les Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {data.students.length === 0 ? (
              <p className="text-sm text-rose-600">
                Tambahkan data siswa terlebih dahulu di menu Data Siswa.
              </p>
            ) : (
              <form onSubmit={handleSaveSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Tanggal * ({getIndonesianDayName(date)})
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Waktu *
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Pilih Nama Siswa *
                  </label>
                  <select
                    value={studentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  >
                    {data.students.map((stu) => (
                      <option key={stu.id} value={stu.id}>
                        {stu.name} ({stu.grade || '-'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-filled Read-Only Info Box */}
                {selectedStudent && (
                  <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Otomatis Terisi dari Database Siswa
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <span className="block text-[11px] font-medium text-slate-500">
                          Lembaga LBB
                        </span>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {selectedLbb?.name || '-'}
                        </p>
                      </div>

                      <div>
                        <span className="block text-[11px] font-medium text-slate-500">
                          Fee Pertemuan
                        </span>
                        <p className="mt-0.5 text-sm font-bold text-emerald-700">
                          {formatRupiah(autoFee)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="mb-1 block text-[11px] font-medium text-slate-500">
                        Mapel yang Diajarkan {selectedStudent.subjects.length > 1 ? '(Pilih salah satu)' : ''}
                      </span>
                      {selectedStudent.subjects.length === 1 ? (
                        <div className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200">
                          {selectedSubject?.name}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.subjects.map((sub) => {
                            const active = sub.id === selectedSubject?.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => handleSubjectChange(sub.id)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                  active
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {sub.name} ({formatRupiah(sub.fee)})
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Catatan Materi / Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Persiapan ulangan bab 3"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Simpan Jadwal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Reschedule */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Reschedule Jadwal Les</h3>
              <button
                onClick={() => setRescheduleTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">
                  {studentMap[rescheduleTarget.studentId]?.name} — {rescheduleTarget.subjectName}
                </p>
                <p className="mt-0.5">
                  Jadwal Asal: {formatDateIndo(rescheduleTarget.date, true)} pukul {rescheduleTarget.time}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Tanggal Pengganti
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Waktu Pengganti
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-violet-200 bg-violet-50/50 p-3 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={keepRescheduleHistory}
                  onChange={(e) => setKeepRescheduleHistory(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-violet-600"
                />
                <span>
                  <strong>Simpan riwayat reschedule:</strong> Jadwal lama otomatis berstatus{' '}
                  <em>Reschedule</em> (Fee Rp 0) dan jadwal baru dibuat pada tanggal pengganti.
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Simpan Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Generate Jadwal Mingguan */}
      {genModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Generate Jadwal Mingguan</h3>
                <p className="text-xs text-slate-500">
                  Otomatis buat jadwal dari template mingguan semua siswa (tanpa duplikat).
                </p>
              </div>
              <button
                onClick={() => setGenModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Mulai Tanggal
                  </label>
                  <input
                    type="date"
                    value={genStartDate}
                    onChange={(e) => setGenStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Durasi Generate
                  </label>
                  <select
                    value={genWeeks}
                    onChange={(e) => setGenWeeks(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value={1}>1 Minggu ke depan</option>
                    <option value={2}>2 Minggu ke depan</option>
                    <option value={4}>4 Minggu (1 Bulan)</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  Akan dibuat {previewGenerated.length} jadwal baru
                </div>
                {previewGenerated.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Semua jadwal pada rentang tersebut sudah ada.
                  </p>
                ) : (
                  <div className="max-h-48 space-y-1.5 overflow-y-auto text-xs">
                    {previewGenerated.map((sch) => (
                      <div
                        key={sch.id}
                        className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200"
                      >
                        <span>
                          <strong>{formatDateIndo(sch.date, true)}</strong> {sch.time} —{' '}
                          {studentMap[sch.studentId]?.name} ({sch.subjectName})
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {formatRupiah(sch.fee)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGenModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={previewGenerated.length === 0}
                  onClick={() => {
                    onBulkAddSchedules(previewGenerated);
                    setGenModalOpen(false);
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Buat {previewGenerated.length} Jadwal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
