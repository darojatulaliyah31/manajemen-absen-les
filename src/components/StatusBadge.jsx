import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Lock, FileText, Globe, ClipboardList } from 'lucide-react';
import { getScheduleLifecycle, LBB_METHOD_LABELS } from '../utils/formatters';

export function LifecycleBadge({ schedule }) {
  const lifecycle = getScheduleLifecycle(schedule);

  if (lifecycle.code === 'sudah_absen') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Sudah Absen
      </span>
    );
  }

  if (lifecycle.code === 'belum_absen') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
        <AlertCircle className="h-3.5 w-3.5" />
        Belum Absen
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
      <Clock className="h-3.5 w-3.5" />
      Akan Datang
    </span>
  );
}

export function AttendanceDetailBadge({ status }) {
  if (!status) return null;

  const styles = {
    hadir: 'bg-emerald-100 text-emerald-800',
    siswa_sakit: 'bg-amber-100 text-amber-800',
    siswa_izin: 'bg-amber-100 text-amber-800',
    tutor_sakit: 'bg-rose-100 text-rose-800',
    tutor_izin: 'bg-rose-100 text-rose-800',
    reschedule: 'bg-violet-100 text-violet-800',
  };

  const labels = {
    hadir: 'Hadir',
    siswa_sakit: 'Siswa Sakit',
    siswa_izin: 'Siswa Izin',
    tutor_sakit: 'Tutor Sakit',
    tutor_izin: 'Tutor Izin',
    reschedule: 'Reschedule',
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {labels[status] || status}
    </span>
  );
}

export function LbbMethodBadge({ method }) {
  const label = LBB_METHOD_LABELS[method] || method;
  if (method === 'google_form') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-purple-200">
        <ClipboardList className="h-3 w-3" />
        {label}
      </span>
    );
  }
  if (method === 'website') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
        <Globe className="h-3 w-3" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      <FileText className="h-3 w-3" />
      {label}
    </span>
  );
}

export function GFormLockBadge({ schedule }) {
  if (!schedule.gformSubmitted) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-300">
      <Lock className="h-3 w-3" />
      G-Form Terkunci
    </span>
  );
}
