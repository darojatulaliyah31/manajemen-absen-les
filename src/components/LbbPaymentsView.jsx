import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  Clock,
  CreditCard,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import {
  PAYMENT_METHODS,
  formatRupiah,
  formatDateIndo,
  formatDateTimeIndo,
  getCurrentMonthKey,
  getMonthLabel,
  generateId,
} from '../utils/formatters';
import { LbbMethodBadge } from './StatusBadge';

export default function LbbPaymentsView({ data, onSavePayment }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [expandedLbb, setExpandedLbb] = useState(null);

  // Payment Modal State
  const [payModalLbb, setPayModalLbb] = useState(null);
  const [payStatus, setPayStatus] = useState('paid');
  const [payMethod, setPayMethod] = useState(PAYMENT_METHODS[0]);
  const [paidAt, setPaidAt] = useState('');
  const [payNote, setPayNote] = useState('');

  const studentMap = Object.fromEntries(data.students.map((s) => [s.id, s]));

  // Collect available months from schedules + current month
  const monthSet = new Set([getCurrentMonthKey()]);
  data.schedules.forEach((s) => {
    if (s.date?.length >= 7) monthSet.add(s.date.slice(0, 7));
  });
  const monthOptions = Array.from(monthSet).sort().reverse();

  const monthSchedules = data.schedules.filter((s) =>
    s.date.startsWith(selectedMonth)
  );

  const lbbSummaries = data.lbbs.map((lbb) => {
    const lbbSchedules = monthSchedules
      .filter((s) => s.lbbId === lbb.id)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    const attended = lbbSchedules.filter((s) => s.attendanceStatus === 'hadir');
    const totalFee = attended.reduce((sum, s) => sum + (Number(s.fee) || 0), 0);
    const payment = data.payments.find(
      (p) => p.monthKey === selectedMonth && p.lbbId === lbb.id
    );
    return {
      lbb,
      allSchedules: lbbSchedules,
      attended,
      totalFee,
      payment,
    };
  });

  const grandTotalFee = lbbSummaries.reduce((sum, x) => sum + x.totalFee, 0);
  const totalPaidFee = lbbSummaries.reduce(
    (sum, x) => (x.payment?.status === 'paid' ? sum + x.totalFee : sum),
    0
  );
  const totalUnpaidFee = grandTotalFee - totalPaidFee;

  const openPaymentModal = (summary) => {
    const nowLocal = new Date();
    const localIso = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(nowLocal.getDate()).padStart(2, '0')}T${String(
      nowLocal.getHours()
    ).padStart(2, '0')}:${String(nowLocal.getMinutes()).padStart(2, '0')}`;

    setPayModalLbb(summary);
    setPayStatus(summary.payment?.status || 'paid');
    setPayMethod(summary.payment?.paymentMethod || PAYMENT_METHODS[0]);
    setPaidAt(summary.payment?.paidAt || localIso);
    setPayNote(summary.payment?.note || '');
  };

  const handleSavePaymentSubmit = (e) => {
    e.preventDefault();
    if (!payModalLbb) return;
    onSavePayment({
      id: payModalLbb.payment?.id || generateId('pay'),
      monthKey: selectedMonth,
      lbbId: payModalLbb.lbb.id,
      status: payStatus,
      paymentMethod: payStatus === 'paid' ? payMethod : '',
      paidAt: payStatus === 'paid' ? paidAt : '',
      note: payNote.trim(),
    });
    setPayModalLbb(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Rekap & Pembayaran Fee LBB</h2>
          <p className="text-sm text-slate-500">
            Pantau total fee per lembaga, status pencairan oleh LBB, metode transfer, dan waktu pembayaran.
          </p>
        </div>
        <div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-xs outline-none focus:border-indigo-500"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {getMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Fee {getMonthLabel(selectedMonth)}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatRupiah(grandTotalFee)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Sudah Dibayar LBB
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{formatRupiah(totalPaidFee)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Belum Dibayar LBB
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{formatRupiah(totalUnpaidFee)}</p>
        </div>
      </div>

      {/* LBB Payment Cards */}
      <div className="space-y-4">
        {lbbSummaries.map((item) => {
          const { lbb, attended, totalFee, payment } = item;
          const isPaid = payment?.status === 'paid';
          const isExpanded = expandedLbb === lbb.id;

          return (
            <div
              key={lbb.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
            >
              <div className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{lbb.name}</h3>
                    <LbbMethodBadge method={lbb.attendanceMethod} />
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Sudah Dibayar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                        <Clock className="h-3.5 w-3.5" />
                        Belum Dibayar
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600">
                    Total Pertemuan Hadir: <strong>{attended.length} sesi</strong> • Total Fee:{' '}
                    <strong className="text-emerald-700">{formatRupiah(totalFee)}</strong>
                  </p>

                  {isPaid && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                        <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                        Via: {payment.paymentMethod || '-'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-emerald-600" />
                        Waktu: {formatDateTimeIndo(payment.paidAt)}
                      </span>
                      {payment.note && (
                        <span className="text-slate-500">Catatan: {payment.note}</span>
                      )}
                    </div>
                  )}
                  {!isPaid && payment?.note && (
                    <p className="text-xs text-slate-500">Catatan: {payment.note}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setExpandedLbb(isExpanded ? null : lbb.id)}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    {isExpanded ? (
                      <>
                        Tutup Rincian <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Lihat Rincian ({attended.length}) <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => openPaymentModal(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                  >
                    <Wallet className="h-4 w-4" />
                    {isPaid ? 'Update Info Bayar' : 'Catat Pembayaran'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/70 p-4">
                  {attended.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Belum ada pertemuan berstatus Hadir di bulan {getMonthLabel(selectedMonth)}.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-slate-500">
                          <tr>
                            <th className="pb-2">Tanggal & Jam</th>
                            <th className="pb-2">Siswa</th>
                            <th className="pb-2">Mapel</th>
                            <th className="pb-2 text-right">Fee</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70">
                          {attended.map((s) => (
                            <tr key={s.id}>
                              <td className="py-2 font-medium text-slate-800">
                                {formatDateIndo(s.date, true)} • {s.time}
                              </td>
                              <td className="py-2 text-slate-700">
                                {studentMap[s.studentId]?.name || '-'}
                              </td>
                              <td className="py-2 text-slate-700">{s.subjectName}</td>
                              <td className="py-2 text-right font-semibold text-emerald-700">
                                {formatRupiah(s.fee)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Update Pembayaran LBB */}
      {payModalLbb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Status Pembayaran Fee</h3>
                <p className="text-xs text-slate-500">
                  {payModalLbb.lbb.name} • {getMonthLabel(selectedMonth)}
                </p>
              </div>
              <button
                onClick={() => setPayModalLbb(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentSubmit} className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <span className="text-slate-500">Total Tagihan Fee: </span>
                <strong className="text-emerald-700">
                  {formatRupiah(payModalLbb.totalFee)}
                </strong>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Status Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayStatus('paid')}
                    className={`rounded-xl border py-2.5 text-xs font-bold ${
                      payStatus === 'paid'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Sudah Dibayar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayStatus('unpaid')}
                    className={`rounded-xl border py-2.5 text-xs font-bold ${
                      payStatus === 'unpaid'
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Belum Dibayar
                  </button>
                </div>
              </div>

              {payStatus === 'paid' && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Pembayaran Via
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Tanggal & Waktu Diterima
                    </label>
                    <input
                      type="datetime-local"
                      value={paidAt}
                      onChange={(e) => setPaidAt(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Contoh: Transfer dari admin Ibu Rina..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setPayModalLbb(null)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Simpan Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
