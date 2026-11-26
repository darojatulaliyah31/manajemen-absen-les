import React, { useState } from 'react';
import { Download, Printer, BarChart3, TrendingUp } from 'lucide-react';
import { formatRupiah, getMonthLabel } from '../utils/formatters';

export default function MonthlyReportView({ data }) {
  const currentYear = String(new Date().getFullYear());
  const yearSet = new Set([currentYear]);
  data.schedules.forEach((s) => {
    if (s.date?.length >= 4) yearSet.add(s.date.slice(0, 4));
  });
  const yearOptions = Array.from(yearSet).sort().reverse();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedLbb, setSelectedLbb] = useState('all');

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return `${selectedYear}-${m}`;
  });

  const rows = months.map((monthKey) => {
    const monthSchedules = data.schedules.filter(
      (s) =>
        s.date.startsWith(monthKey) &&
        (selectedLbb === 'all' || s.lbbId === selectedLbb)
    );

    const totalJadwal = monthSchedules.length;
    const hadir = monthSchedules.filter((s) => s.attendanceStatus === 'hadir');
    const tidakHadir = monthSchedules.filter(
      (s) => s.attendanceStatus && s.attendanceStatus !== 'hadir'
    );
    const belumAtauAkan = monthSchedules.filter((s) => !s.attendanceStatus);

    const totalFee = hadir.reduce((sum, s) => sum + (Number(s.fee) || 0), 0);

    // Hitung fee terbayar per LBB untuk bulan tersebut
    let paidFee = 0;
    const lbbIdsToCheck =
      selectedLbb === 'all' ? data.lbbs.map((l) => l.id) : [selectedLbb];

    lbbIdsToCheck.forEach((lbbId) => {
      const lbbEarned = hadir
        .filter((s) => s.lbbId === lbbId)
        .reduce((sum, s) => sum + (Number(s.fee) || 0), 0);
      const pay = data.payments.find(
        (p) => p.monthKey === monthKey && p.lbbId === lbbId
      );
      if (pay?.status === 'paid') {
        paidFee += lbbEarned;
      }
    });

    return {
      monthKey,
      label: getMonthLabel(monthKey),
      totalJadwal,
      hadirCount: hadir.length,
      tidakHadirCount: tidakHadir.length,
      pendingCount: belumAtauAkan.length,
      totalFee,
      paidFee,
      unpaidFee: totalFee - paidFee,
    };
  });

  const maxFee = Math.max(1, ...rows.map((r) => r.totalFee));
  const annualTotalFee = rows.reduce((sum, r) => sum + r.totalFee, 0);
  const annualPaidFee = rows.reduce((sum, r) => sum + r.paidFee, 0);
  const annualHadirCount = rows.reduce((sum, r) => sum + r.hadirCount, 0);

  const exportCsv = () => {
    const header = [
      'Bulan',
      'Total Jadwal',
      'Hadir',
      'Izin/Sakit/Reschedule',
      'Belum/Akan Datang',
      'Total Fee Diperoleh',
      'Sudah Dibayar LBB',
      'Belum Dibayar LBB',
    ];
    const csvRows = [
      header.join(','),
      ...rows.map((r) =>
        [
          `"${r.label}"`,
          r.totalJadwal,
          r.hadirCount,
          r.tidakHadirCount,
          r.pendingCount,
          r.totalFee,
          r.paidFee,
          r.unpaidFee,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-fee-les-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Laporan Perolehan Fee Bulanan</h2>
          <p className="text-sm text-slate-500">
            Rekap pendapatan mengajar setiap bulan sepanjang tahun beserta status pembayaran LBB.
          </p>
        </div>

        <div className="no-print flex flex-wrap gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>

          <select
            value={selectedLbb}
            onChange={(e) => setSelectedLbb(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
          >
            <option value="all">Semua LBB</option>
            {data.lbbs.map((lbb) => (
              <option key={lbb.id} value={lbb.id}>
                {lbb.name}
              </option>
            ))}
          </select>

          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4" />
            Cetak / PDF
          </button>
        </div>
      </div>

      {/* Annual KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Fee Tahun {selectedYear}
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatRupiah(annualTotalFee)}</p>
          <p className="mt-1 text-xs text-slate-500">{annualHadirCount} pertemuan hadir</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Sudah Cair / Dibayar LBB
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{formatRupiah(annualPaidFee)}</p>
          <p className="mt-1 text-xs text-emerald-700/80">
            {annualTotalFee > 0
              ? `${Math.round((annualPaidFee / annualTotalFee) * 100)}% dari total fee`
              : '0%'}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Menunggu Pembayaran LBB
          </span>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {formatRupiah(annualTotalFee - annualPaidFee)}
          </p>
          <p className="mt-1 text-xs text-amber-700/80">Periksa di menu Pembayaran LBB</p>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Grafik Perolehan Fee per Bulan ({selectedYear})
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-xs bg-indigo-500" /> Total Fee
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" /> Sudah Dibayar
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 items-end gap-2 pt-4" style={{ height: '210px' }}>
          {rows.map((r) => {
            const totalPct = Math.round((r.totalFee / maxFee) * 100);
            const paidPct = Math.round((r.paidFee / maxFee) * 100);
            const shortMonth = r.label.slice(0, 3);
            return (
              <div
                key={r.monthKey}
                className="group flex h-full flex-col items-center justify-end"
                title={`${r.label}: Total ${formatRupiah(r.totalFee)} (Dibayar: ${formatRupiah(r.paidFee)})`}
              >
                <div className="relative flex h-40 w-full items-end justify-center gap-0.5 px-0.5">
                  <div
                    className="w-1/2 rounded-t-md bg-indigo-500 transition-all group-hover:bg-indigo-600"
                    style={{ height: `${r.totalFee > 0 ? Math.max(6, totalPct) : 2}%` }}
                  />
                  <div
                    className="w-1/2 rounded-t-md bg-emerald-500 transition-all group-hover:bg-emerald-600"
                    style={{ height: `${r.paidFee > 0 ? Math.max(6, paidPct) : 0}%` }}
                  />
                </div>
                <span className="mt-2 text-[11px] font-semibold text-slate-500">
                  {shortMonth}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Monthly Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Bulan</th>
                <th className="px-4 py-3 text-center">Total Jadwal</th>
                <th className="px-4 py-3 text-center">Hadir</th>
                <th className="px-4 py-3 text-center">Izin/Sakit/Reschedule</th>
                <th className="px-4 py-3 text-right">Total Fee Diperoleh</th>
                <th className="px-4 py-3 text-right">Sudah Dibayar LBB</th>
                <th className="px-4 py-3 text-right">Belum Dibayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.monthKey} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.label}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{r.totalJadwal}</td>
                  <td className="px-4 py-3 text-center font-semibold text-emerald-700">
                    {r.hadirCount}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">{r.tidakHadirCount}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatRupiah(r.totalFee)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                    {formatRupiah(r.paidFee)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-700">
                    {formatRupiah(r.unpaidFee)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
