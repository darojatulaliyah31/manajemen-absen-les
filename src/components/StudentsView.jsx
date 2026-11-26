import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  BookOpen,
  CalendarClock,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  DAYS_OF_WEEK,
  LBB_METHOD_LABELS,
  formatRupiah,
  generateId,
} from '../utils/formatters';
import { LbbMethodBadge } from './StatusBadge';

const EMPTY_SUBJECT = () => ({
  id: generateId('sub'),
  name: '',
  fee: 75000,
  weeklySchedules: [{ dayOfWeek: 1, time: '16:00' }],
});

export default function StudentsView({
  data,
  onSaveStudent,
  onDeleteStudent,
  onSaveLbb,
  onDeleteLbb,
}) {
  const [search, setSearch] = useState('');
  const [filterLbb, setFilterLbb] = useState('all');
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [lbbModalOpen, setLbbModalOpen] = useState(false);

  // Student form state
  const [editingStudent, setEditingStudent] = useState(null);
  const [stuName, setStuName] = useState('');
  const [stuGrade, setStuGrade] = useState('');
  const [stuAddress, setStuAddress] = useState('');
  const [stuLbbId, setStuLbbId] = useState('');
  const [stuNotes, setStuNotes] = useState('');
  const [stuSubjects, setStuSubjects] = useState([EMPTY_SUBJECT()]);
  const [stuError, setStuError] = useState('');

  // LBB form state
  const [editingLbb, setEditingLbb] = useState(null);
  const [lbbName, setLbbName] = useState('');
  const [lbbMethod, setLbbMethod] = useState('manual');
  const [lbbUrl, setLbbUrl] = useState('');
  const [lbbContact, setLbbContact] = useState('');
  const [lbbNotes, setLbbNotes] = useState('');

  const lbbMap = Object.fromEntries(data.lbbs.map((l) => [l.id, l]));

  const filteredStudents = data.students.filter((stu) => {
    if (filterLbb !== 'all' && stu.lbbId !== filterLbb) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchName = stu.name.toLowerCase().includes(q);
    const matchGrade = (stu.grade || '').toLowerCase().includes(q);
    const matchAddress = (stu.address || '').toLowerCase().includes(q);
    const matchSub = stu.subjects.some((sub) => sub.name.toLowerCase().includes(q));
    return matchName || matchGrade || matchAddress || matchSub;
  });

  const openAddStudent = () => {
    setEditingStudent(null);
    setStuName('');
    setStuGrade('');
    setStuAddress('');
    setStuLbbId(data.lbbs[0]?.id || '');
    setStuNotes('');
    setStuSubjects([EMPTY_SUBJECT()]);
    setStuError('');
    setStudentModalOpen(true);
  };

  const openEditStudent = (stu) => {
    setEditingStudent(stu);
    setStuName(stu.name);
    setStuGrade(stu.grade || '');
    setStuAddress(stu.address || '');
    setStuLbbId(stu.lbbId || data.lbbs[0]?.id || '');
    setStuNotes(stu.notes || '');
    setStuSubjects(
      stu.subjects?.length
        ? stu.subjects.map((sub) => ({
            ...sub,
            weeklySchedules: sub.weeklySchedules?.length
              ? sub.weeklySchedules.map((w) => ({ ...w }))
              : [],
          }))
        : [EMPTY_SUBJECT()]
    );
    setStuError('');
    setStudentModalOpen(true);
  };

  const addSubjectRow = () => {
    setStuSubjects((prev) => [...prev, EMPTY_SUBJECT()]);
  };

  const removeSubjectRow = (subId) => {
    setStuSubjects((prev) => prev.filter((s) => s.id !== subId));
  };

  const updateSubjectField = (subId, field, value) => {
    setStuSubjects((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, [field]: value } : s))
    );
  };

  const addWeeklySlot = (subId) => {
    setStuSubjects((prev) =>
      prev.map((s) =>
        s.id === subId
          ? {
              ...s,
              weeklySchedules: [...s.weeklySchedules, { dayOfWeek: 1, time: '16:00' }],
            }
          : s
      )
    );
  };

  const updateWeeklySlot = (subId, idx, field, value) => {
    setStuSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subId) return s;
        const next = s.weeklySchedules.map((slot, i) =>
          i === idx ? { ...slot, [field]: field === 'dayOfWeek' ? Number(value) : value } : slot
        );
        return { ...s, weeklySchedules: next };
      })
    );
  };

  const removeWeeklySlot = (subId, idx) => {
    setStuSubjects((prev) =>
      prev.map((s) =>
        s.id === subId
          ? {
              ...s,
              weeklySchedules: s.weeklySchedules.filter((_, i) => i !== idx),
            }
          : s
      )
    );
  };

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    if (!stuName.trim()) {
      setStuError('Nama siswa wajib diisi.');
      return;
    }
    if (!stuLbbId) {
      setStuError('Pilih Asal LBB terlebih dahulu (tambahkan LBB jika belum ada).');
      return;
    }
    const cleanSubjects = stuSubjects
      .map((s) => ({
        ...s,
        name: s.name.trim(),
        fee: Number(s.fee) || 0,
      }))
      .filter((s) => s.name);

    if (cleanSubjects.length === 0) {
      setStuError('Minimal harus ada 1 mata pelajaran yang diajarkan.');
      return;
    }

    onSaveStudent({
      id: editingStudent?.id || generateId('stu'),
      name: stuName.trim(),
      grade: stuGrade.trim(),
      address: stuAddress.trim(),
      lbbId: stuLbbId,
      subjects: cleanSubjects,
      notes: stuNotes.trim(),
    });
    setStudentModalOpen(false);
  };

  const openAddLbb = () => {
    setEditingLbb(null);
    setLbbName('');
    setLbbMethod('manual');
    setLbbUrl('');
    setLbbContact('');
    setLbbNotes('');
    setLbbModalOpen(true);
  };

  const openEditLbb = (lbb) => {
    setEditingLbb(lbb);
    setLbbName(lbb.name);
    setLbbMethod(lbb.attendanceMethod || 'manual');
    setLbbUrl(lbb.attendanceUrl || '');
    setLbbContact(lbb.contact || '');
    setLbbNotes(lbb.notes || '');
  };

  const handleLbbSubmit = (e) => {
    e.preventDefault();
    if (!lbbName.trim()) return;
    onSaveLbb({
      id: editingLbb?.id || generateId('lbb'),
      name: lbbName.trim(),
      attendanceMethod: lbbMethod,
      attendanceUrl: lbbUrl.trim(),
      contact: lbbContact.trim(),
      notes: lbbNotes.trim(),
    });
    setEditingLbb(null);
    setLbbName('');
    setLbbMethod('manual');
    setLbbUrl('');
    setLbbContact('');
    setLbbNotes('');
  };

  const getDayLabel = (dayNum) =>
    DAYS_OF_WEEK.find((d) => d.value === Number(dayNum))?.label || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Data Siswa & Lembaga LBB</h2>
          <p className="text-sm text-slate-500">
            Kelola profil siswa, multi-mapel, fee per pertemuan, jadwal mingguan, dan asal LBB.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openAddLbb}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <Building2 className="h-4 w-4 text-indigo-600" />
            Kelola LBB ({data.lbbs.length})
          </button>
          <button
            onClick={openAddStudent}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama siswa, kelas, mapel, atau alamat..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <select
          value={filterLbb}
          onChange={(e) => setFilterLbb(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
        >
          <option value="all">Semua Lembaga LBB</option>
          {data.lbbs.map((lbb) => (
            <option key={lbb.id} value={lbb.id}>
              {lbb.name} ({LBB_METHOD_LABELS[lbb.attendanceMethod]})
            </option>
          ))}
        </select>
      </div>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-base font-semibold text-slate-700">Belum ada data siswa yang cocok</p>
          <p className="mt-1 text-sm text-slate-500">
            Klik tombol "Tambah Siswa" untuk menambahkan siswa baru beserta mapel dan jadwal mingguannya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredStudents.map((stu) => {
            const lbb = lbbMap[stu.lbbId];
            const totalSessionsPerWeek = stu.subjects.reduce(
              (acc, sub) => acc + (sub.weeklySchedules?.length || 0),
              0
            );
            const weeklyFeePotential = stu.subjects.reduce(
              (acc, sub) => acc + (Number(sub.fee) || 0) * (sub.weeklySchedules?.length || 0),
              0
            );

            return (
              <div
                key={stu.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{stu.name}</h3>
                        {stu.grade && (
                          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                            {stu.grade}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {lbb?.name || 'LBB tidak ditemukan'}
                        </span>
                        {lbb && <LbbMethodBadge method={lbb.attendanceMethod} />}
                      </div>
                      {stu.address && (
                        <p className="mt-1.5 flex items-start gap-1 text-xs text-slate-500">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {stu.address}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => openEditStudent(stu)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                        title="Edit Siswa"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus siswa "${stu.name}"? Jadwal yang sudah tercatat akan tetap tersimpan.`)) {
                            onDeleteStudent(stu.id);
                          }
                        }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Multi-Mapel Recap */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        Mapel Diajarkan ({stu.subjects.length})
                      </span>
                      <span>
                        {totalSessionsPerWeek}x/minggu • {formatRupiah(weeklyFeePotential)}/mg
                      </span>
                    </div>

                    {stu.subjects.map((sub) => (
                      <div
                        key={sub.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-800">{sub.name}</span>
                          <span className="text-sm font-bold text-emerald-700">
                            {formatRupiah(sub.fee)} / pertemuan
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                          {sub.weeklySchedules?.length ? (
                            sub.weeklySchedules.map((slot, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                              >
                                {getDayLabel(slot.dayOfWeek)} {slot.time}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs italic text-slate-400">Jadwal fleksibel</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {stu.notes && (
                  <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                    Catatan: {stu.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Siswa */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setStudentModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Nama Siswa *
                  </label>
                  <input
                    type="text"
                    value={stuName}
                    onChange={(e) => setStuName(e.target.value)}
                    placeholder="Contoh: Alya Putri"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Kelas
                  </label>
                  <input
                    type="text"
                    value={stuGrade}
                    onChange={(e) => setStuGrade(e.target.value)}
                    placeholder="Contoh: 11 SMA / 8 SMP"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Asal LBB (Lembaga) *
                  </label>
                  <select
                    value={stuLbbId}
                    onChange={(e) => setStuLbbId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  >
                    {data.lbbs.map((lbb) => (
                      <option key={lbb.id} value={lbb.id}>
                        {lbb.name} ({LBB_METHOD_LABELS[lbb.attendanceMethod]})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Alamat Siswa
                  </label>
                  <input
                    type="text"
                    value={stuAddress}
                    onChange={(e) => setStuAddress(e.target.value)}
                    placeholder="Jl. Melati No. 14..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Multi-Mapel Section */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Mata Pelajaran, Fee & Jadwal Mingguan
                    </h4>
                    <p className="text-xs text-slate-500">
                      Jika mengajar lebih dari 1 mapel untuk siswa ini, klik "+ Tambah Mapel" agar semua terekap.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addSubjectRow}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Mapel
                  </button>
                </div>

                <div className="space-y-3">
                  {stuSubjects.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700">
                          Mapel #{idx + 1}
                        </span>
                        {stuSubjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubjectRow(sub.id)}
                            className="text-xs font-medium text-rose-600 hover:underline"
                          >
                            Hapus Mapel
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Nama Mapel *
                          </label>
                          <input
                            type="text"
                            value={sub.name}
                            onChange={(e) => updateSubjectField(sub.id, 'name', e.target.value)}
                            placeholder="Contoh: Matematika"
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Fee per Pertemuan (Rp) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={sub.fee}
                            onChange={(e) => updateSubjectField(sub.id, 'fee', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Weekly Schedules for this Subject */}
                      <div className="mt-3 border-t border-slate-100 pt-2.5">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-600">
                            Jadwal Mingguan Tetap
                          </span>
                          <button
                            type="button"
                            onClick={() => addWeeklySlot(sub.id)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            + Tambah Hari/Jam
                          </button>
                        </div>
                        {sub.weeklySchedules.length === 0 ? (
                          <p className="text-xs italic text-slate-400">
                            Belum ada jadwal tetap (bisa ditambah manual di Jadwal Les).
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {sub.weeklySchedules.map((slot, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-2">
                                <select
                                  value={slot.dayOfWeek}
                                  onChange={(e) =>
                                    updateWeeklySlot(sub.id, sIdx, 'dayOfWeek', e.target.value)
                                  }
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none"
                                >
                                  {DAYS_OF_WEEK.map((d) => (
                                    <option key={d.value} value={d.value}>
                                      {d.label}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="time"
                                  value={slot.time}
                                  onChange={(e) =>
                                    updateWeeklySlot(sub.id, sIdx, 'time', e.target.value)
                                  }
                                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeWeeklySlot(sub.id, sIdx)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={stuNotes}
                  onChange={(e) => setStuNotes(e.target.value)}
                  placeholder="Contoh: Fokus persiapan UTBK..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {stuError && (
                <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {stuError}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola LBB */}
      {lbbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Kelola Lembaga Les (LBB)</h3>
                <p className="text-xs text-slate-500">
                  Tentukan metode absensi tiap LBB (Manual, Google Form, atau Website LBB).
                </p>
              </div>
              <button
                onClick={() => setLbbModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Add/Edit LBB */}
            <form onSubmit={handleLbbSubmit} className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  {editingLbb ? `Edit: ${editingLbb.name}` : 'Tambah LBB Baru'}
                </h4>
                {editingLbb && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLbb(null);
                      setLbbName('');
                      setLbbMethod('manual');
                      setLbbUrl('');
                      setLbbContact('');
                      setLbbNotes('');
                    }}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Nama LBB *</label>
                  <input
                    type="text"
                    value={lbbName}
                    onChange={(e) => setLbbName(e.target.value)}
                    placeholder="Contoh: LBB Bintang Prestasi"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Metode Absensi *</label>
                  <select
                    value={lbbMethod}
                    onChange={(e) => setLbbMethod(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="manual">Manual (Kertas)</option>
                    <option value="google_form">Google Form (Aktifkan Anti-Double Guard)</option>
                    <option value="website">Website LBB Tersendiri</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Link Google Form / Website (Opsional)
                  </label>
                  <input
                    type="url"
                    value={lbbUrl}
                    onChange={(e) => setLbbUrl(e.target.value)}
                    placeholder="https://docs.google.com/forms/..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Kontak Admin LBB</label>
                  <input
                    type="text"
                    value={lbbContact}
                    onChange={(e) => setLbbContact(e.target.value)}
                    placeholder="08xx-xxxx-xxxx"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Catatan</label>
                <input
                  type="text"
                  value={lbbNotes}
                  onChange={(e) => setLbbNotes(e.target.value)}
                  placeholder="Info pencairan fee atau aturan absensi..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                {editingLbb ? 'Update LBB' : '+ Simpan LBB'}
              </button>
            </form>

            {/* List Existing LBB */}
            <div className="space-y-2.5">
              {data.lbbs.map((lbb) => (
                <div
                  key={lbb.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3.5"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{lbb.name}</span>
                      <LbbMethodBadge method={lbb.attendanceMethod} />
                    </div>
                    {lbb.attendanceUrl && (
                      <a
                        href={lbb.attendanceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                      >
                        {lbb.attendanceUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {lbb.notes && <p className="mt-1 text-xs text-slate-500">{lbb.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEditLbb(lbb)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        const used = data.students.some((s) => s.lbbId === lbb.id);
                        if (used) {
                          alert('LBB ini masih memiliki siswa terdaftar. Pindahkan atau hapus siswa terlebih dahulu.');
                          return;
                        }
                        if (window.confirm(`Hapus ${lbb.name}?`)) {
                          onDeleteLbb(lbb.id);
                        }
                      }}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
