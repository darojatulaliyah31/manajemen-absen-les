export const DAYS_OF_WEEK = [
  { value: 1, label: 'Senin', short: 'Sen' },
  { value: 2, label: 'Selasa', short: 'Sel' },
  { value: 3, label: 'Rabu', short: 'Rab' },
  { value: 4, label: 'Kamis', short: 'Kam' },
  { value: 5, label: 'Jumat', short: 'Jum' },
  { value: 6, label: 'Sabtu', short: 'Sab' },
  { value: 0, label: 'Minggu', short: 'Min' },
];

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export const ATTENDANCE_OPTIONS = [
  { value: 'hadir', label: 'Hadir', countsFee: true, color: 'emerald' },
  { value: 'siswa_sakit', label: 'Siswa Sakit', countsFee: false, color: 'amber' },
  { value: 'siswa_izin', label: 'Siswa Izin', countsFee: false, color: 'amber' },
  { value: 'tutor_sakit', label: 'Tutor Sakit', countsFee: false, color: 'rose' },
  { value: 'tutor_izin', label: 'Tutor Izin', countsFee: false, color: 'rose' },
  { value: 'reschedule', label: 'Reschedule', countsFee: false, color: 'violet' },
];

export const LBB_METHOD_LABELS = {
  manual: 'Manual (Kertas)',
  google_form: 'Google Form',
  website: 'Website LBB',
};

export const PAYMENT_METHODS = [
  'Transfer Bank BCA',
  'Transfer Bank BRI',
  'Transfer Bank Mandiri',
  'Transfer Bank BNI',
  'Transfer Bank Lainnya',
  'E-Wallet (GoPay / OVO / DANA)',
  'QRIS',
  'Tunai / Cash',
];

export function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDateStr() {
  return toDateStr(new Date());
}

export function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getIndonesianDayName(dateStr) {
  const date = parseLocalDate(dateStr);
  const day = date.getDay();
  const found = DAYS_OF_WEEK.find((d) => d.value === day);
  return found ? found.label : '';
}

export function formatDateIndo(dateStr, includeDay = false) {
  if (!dateStr) return '-';
  const date = parseLocalDate(dateStr);
  const day = date.getDate();
  const month = MONTH_SHORT[date.getMonth()];
  const year = date.getFullYear();
  const base = `${day} ${month} ${year}`;
  if (includeDay) {
    return `${getIndonesianDayName(dateStr)}, ${base}`;
  }
  return base;
}

export function formatDateTimeIndo(isoStr) {
  if (!isoStr) return '-';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return isoStr;
  const day = date.getDate();
  const month = MONTH_SHORT[date.getMonth()];
  const year = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}

export function getMonthLabel(monthKey) {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function getWeekDates(referenceDateStr = getTodayDateStr()) {
  const ref = parseLocalDate(referenceDateStr);
  const day = ref.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diffToMonday);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(toDateStr(d));
  }
  return dates;
}

export function isSchedulePast(dateStr, timeStr = '00:00', now = new Date()) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
  const scheduleDate = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);
  return scheduleDate.getTime() <= now.getTime();
}

export function getAttendanceOption(status) {
  return ATTENDANCE_OPTIONS.find((opt) => opt.value === status) || null;
}

export function getScheduleLifecycle(schedule, now = new Date()) {
  if (schedule.attendanceStatus) {
    const opt = getAttendanceOption(schedule.attendanceStatus);
    return {
      code: 'sudah_absen',
      label: 'Sudah Absen',
      detailLabel: opt ? opt.label : schedule.attendanceStatus,
      countsFee: opt ? opt.countsFee : false,
    };
  }
  if (isSchedulePast(schedule.date, schedule.time, now)) {
    return {
      code: 'belum_absen',
      label: 'Belum Absen',
      detailLabel: 'Menunggu Absensi',
      countsFee: false,
    };
  }
  return {
    code: 'akan_datang',
    label: 'Akan Datang',
    detailLabel: 'Jadwal Mendatang',
    countsFee: false,
  };
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
