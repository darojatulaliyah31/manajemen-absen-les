import { toDateStr } from '../utils/formatters';

function offsetDateStr(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return toDateStr(d);
}

function monthDateStr(monthsOffset, dayOfMonth) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsOffset);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dayOfMonth, maxDay));
  return toDateStr(d);
}

function monthKeyOffset(monthsOffset) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsOffset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function createSeedData() {
  const prevMonth1 = monthKeyOffset(-1);
  const prevMonth2 = monthKeyOffset(-2);

  const lbbs = [
    {
      id: 'lbb-1',
      name: 'LBB Cerdas Mandiri',
      attendanceMethod: 'manual',
      attendanceUrl: '',
      contact: '0812-3456-7890',
      notes: 'Absen menggunakan kertas rekap yang ditandatangani wali murid tiap akhir bulan.',
    },
    {
      id: 'lbb-2',
      name: 'LBB Bintang Prestasi',
      attendanceMethod: 'google_form',
      attendanceUrl: 'https://docs.google.com/forms',
      contact: '0856-9876-5432',
      notes: 'Wajib isi Google Form setelah sesi selesai. Jangan sampai isi 2x untuk sesi yang sama.',
    },
    {
      id: 'lbb-3',
      name: 'LBB EduPrima Portal',
      attendanceMethod: 'website',
      attendanceUrl: 'https://eduprima.example.id',
      contact: '0878-1122-3344',
      notes: 'Login ke portal web LBB EduPrima lalu klik Hadir pada jadwal siswa.',
    },
  ];

  const students = [
    {
      id: 'stu-1',
      name: 'Alya Putri',
      grade: '11 SMA',
      address: 'Jl. Melati No. 14, Sukamaju',
      lbbId: 'lbb-2',
      subjects: [
        {
          id: 'sub-1a',
          name: 'Matematika',
          fee: 85000,
          weeklySchedules: [{ dayOfWeek: 1, time: '16:00' }],
        },
        {
          id: 'sub-1b',
          name: 'Fisika',
          fee: 90000,
          weeklySchedules: [{ dayOfWeek: 4, time: '16:00' }],
        },
      ],
      notes: 'Fokus latihan soal UTBK & ulangan harian.',
    },
    {
      id: 'stu-2',
      name: 'Bima Pratama',
      grade: '8 SMP',
      address: 'Perum Griya Asri Blok B3',
      lbbId: 'lbb-1',
      subjects: [
        {
          id: 'sub-2a',
          name: 'Matematika',
          fee: 70000,
          weeklySchedules: [
            { dayOfWeek: 2, time: '15:30' },
            { dayOfWeek: 5, time: '15:30' },
          ],
        },
      ],
      notes: 'Orang tua minta laporan singkat tiap selesai bab.',
    },
    {
      id: 'stu-3',
      name: 'Citra Kirana',
      grade: '9 SMP',
      address: 'Jl. Kenanga Raya No. 8',
      lbbId: 'lbb-3',
      subjects: [
        {
          id: 'sub-3a',
          name: 'IPA Terpadu',
          fee: 75000,
          weeklySchedules: [{ dayOfWeek: 3, time: '16:30' }],
        },
        {
          id: 'sub-3b',
          name: 'Bahasa Inggris',
          fee: 75000,
          weeklySchedules: [{ dayOfWeek: 6, time: '10:00' }],
        },
      ],
      notes: 'Persiapan ujian akhir semester.',
    },
    {
      id: 'stu-4',
      name: 'Dimas Nugroho',
      grade: '6 SD',
      address: 'Jl. Anggrek No. 21',
      lbbId: 'lbb-2',
      subjects: [
        {
          id: 'sub-4a',
          name: 'Semua Mapel (Tematik)',
          fee: 65000,
          weeklySchedules: [{ dayOfWeek: 3, time: '14:00' }],
        },
      ],
      notes: 'Membantu PR sekolah dan latihan berhitung.',
    },
  ];

  const today = offsetDateStr(0);
  const yesterday = offsetDateStr(-1);
  const twoDaysAgo = offsetDateStr(-2);
  const tomorrow = offsetDateStr(1);
  const twoDaysLater = offsetDateStr(2);
  const threeDaysLater = offsetDateStr(3);

  const schedules = [
    // Two months ago
    {
      id: 'sch-prev2-1',
      date: monthDateStr(-2, 5),
      time: '16:00',
      studentId: 'stu-1',
      lbbId: 'lbb-2',
      subjectId: 'sub-1a',
      subjectName: 'Matematika',
      fee: 85000,
      attendanceStatus: 'hadir',
      attendanceUpdatedAt: `${monthDateStr(-2, 5)}T18:05`,
      gformSubmitted: true,
      gformSubmittedAt: `${monthDateStr(-2, 5)}T18:05`,
      notes: 'Materi Turunan Fungsi',
    },
    {
      id: 'sch-prev2-2',
      date: monthDateStr(-2, 12),
      time: '15:30',
      studentId: 'stu-2',
      lbbId: 'lbb-1',
      subjectId: 'sub-2a',
      subjectName: 'Matematika',
      fee: 70000,
      attendanceStatus: 'hadir',
      attendanceUpdatedAt: `${monthDateStr(-2, 12)}T17:10`,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: 'Persamaan Linear',
    },
    {
      id: 'sch-prev2-3',
      date: monthDateStr(-2, 18),
      time: '16:30',
      studentId: 'stu-3',
      lbbId: 'lbb-3',
      subjectId: 'sub-3a',
      subjectName: 'IPA Terpadu',
      fee: 75000,
      attendanceStatus: 'hadir',
      attendanceUpdatedAt: `${monthDateStr(-2, 18)}T18:10`,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: '',
    },
    // Previous month
    {
      id: 'sch-prev1-1',
      date: monthDateStr(-1, 4),
      time: '16:00',
      studentId: 'stu-1',
      lbbId: 'lbb-2',
      subjectId: 'sub-1a',
      subjectName: 'Matematika',
      fee: 85000,
      attendanceStatus: 'hadir',
      attendanceUpdatedAt: `${monthDateStr(-1, 4)}T18:00`,
      gformSubmitted: true,
      gformSubmittedAt: `${monthDateStr(-1, 4)}T18:00`,
      notes: '',
    },
    {
      id: 'sch-prev1-2',
      date: monthDateStr(-1, 11),
      time: '16:00',
      studentId: 'stu-1',
      lbbId: 'lbb-2',
      subjectId: 'sub-1b',
      subjectName: 'Fisika',
      fee: 90000,
      attendanceStatus: 'hadir',
      attendanceUpdatedAt: `${monthDateStr(-1, 11)}T18:00`,
      gformSubmitted: true,
      gformSubmittedAt: `${monthDateStr(-1, 11)}T18:00`,
      notes: '',
    },
    {
      id: 'sch-prev1-3',
      date: monthDateStr(-1, 15),
      time: '15:30',
      studentId: 'stu-2',
      lbbId: 'lbb-1',
      subjectId: 'sub-2a',
      subjectName: 'Matematika',
      fee: 70000,
      attendanceStatus: 'hadir',
      attendanceUpdatedAt: `${monthDateStr(-1, 15)}T17:15`,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: '',
    },
    {
      id: 'sch-prev1-4',
      date: monthDateStr(-1, 20),
      time: '10:00',
      studentId: 'stu-3',
      lbbId: 'lbb-3',
      subjectId: 'sub-3b',
      subjectName: 'Bahasa Inggris',
      fee: 75000,
      attendanceStatus: 'hadir',
      attendanceUpdatedAt: `${monthDateStr(-1, 20)}T11:45`,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: '',
    },
    // Current week & month
    {
      id: 'sch-cur-1',
      date: twoDaysAgo,
      time: '15:30',
      studentId: 'stu-2',
      lbbId: 'lbb-1',
      subjectId: 'sub-2a',
      subjectName: 'Matematika',
      fee: 70000,
      attendanceStatus: 'hadir',
      attendanceUpdatedAt: `${twoDaysAgo}T17:15`,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: 'Bab Teorema Pythagoras',
    },
    {
      id: 'sch-cur-2',
      date: yesterday,
      time: '16:00',
      studentId: 'stu-1',
      lbbId: 'lbb-2',
      subjectId: 'sub-1a',
      subjectName: 'Matematika',
      fee: 85000,
      attendanceStatus: null, // Belum Absen (G-Form example!)
      attendanceUpdatedAt: null,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: 'Latihan Integral',
    },
    {
      id: 'sch-cur-3',
      date: yesterday,
      time: '18:30',
      studentId: 'stu-3',
      lbbId: 'lbb-3',
      subjectId: 'sub-3a',
      subjectName: 'IPA Terpadu',
      fee: 75000,
      attendanceStatus: null, // Belum Absen (Website LBB example)
      attendanceUpdatedAt: null,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: '',
    },
    {
      id: 'sch-cur-4',
      date: today,
      time: '14:00',
      studentId: 'stu-4',
      lbbId: 'lbb-2',
      subjectId: 'sub-4a',
      subjectName: 'Semua Mapel (Tematik)',
      fee: 65000,
      attendanceStatus: 'hadir',
      attendanceUpdatedAt: `${today}T15:35`,
      gformSubmitted: true,
      gformSubmittedAt: `${today}T15:35`,
      notes: 'Sudah isi G-Form tepat setelah selesai',
    },
    {
      id: 'sch-cur-5',
      date: today,
      time: '21:00',
      studentId: 'stu-1',
      lbbId: 'lbb-2',
      subjectId: 'sub-1b',
      subjectName: 'Fisika',
      fee: 90000,
      attendanceStatus: null,
      attendanceUpdatedAt: null,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: 'Persiapan kuis Listrik Dinamis',
    },
    {
      id: 'sch-cur-6',
      date: tomorrow,
      time: '15:30',
      studentId: 'stu-2',
      lbbId: 'lbb-1',
      subjectId: 'sub-2a',
      subjectName: 'Matematika',
      fee: 70000,
      attendanceStatus: null,
      attendanceUpdatedAt: null,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: '',
    },
    {
      id: 'sch-cur-7',
      date: twoDaysLater,
      time: '10:00',
      studentId: 'stu-3',
      lbbId: 'lbb-3',
      subjectId: 'sub-3b',
      subjectName: 'Bahasa Inggris',
      fee: 75000,
      attendanceStatus: null,
      attendanceUpdatedAt: null,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: '',
    },
    {
      id: 'sch-cur-8',
      date: threeDaysLater,
      time: '16:00',
      studentId: 'stu-1',
      lbbId: 'lbb-2',
      subjectId: 'sub-1a',
      subjectName: 'Matematika',
      fee: 85000,
      attendanceStatus: null,
      attendanceUpdatedAt: null,
      gformSubmitted: false,
      gformSubmittedAt: null,
      notes: '',
    },
  ];

  const payments = [
    {
      id: `pay-${prevMonth2}-lbb-1`,
      monthKey: prevMonth2,
      lbbId: 'lbb-1',
      status: 'paid',
      paymentMethod: 'Transfer Bank BCA',
      paidAt: `${monthDateStr(-1, 2)}T10:30`,
      note: 'Rekap bulan lalu lunas',
    },
    {
      id: `pay-${prevMonth2}-lbb-2`,
      monthKey: prevMonth2,
      lbbId: 'lbb-2',
      status: 'paid',
      paymentMethod: 'Transfer Bank Mandiri',
      paidAt: `${monthDateStr(-1, 4)}T14:15`,
      note: 'Lunas via transfer admin',
    },
    {
      id: `pay-${prevMonth2}-lbb-3`,
      monthKey: prevMonth2,
      lbbId: 'lbb-3',
      status: 'paid',
      paymentMethod: 'E-Wallet (GoPay / OVO / DANA)',
      paidAt: `${monthDateStr(-1, 5)}T09:00`,
      note: '',
    },
    {
      id: `pay-${prevMonth1}-lbb-1`,
      monthKey: prevMonth1,
      lbbId: 'lbb-1',
      status: 'paid',
      paymentMethod: 'Transfer Bank BCA',
      paidAt: `${monthDateStr(0, 3)}T11:20`,
      note: '',
    },
    {
      id: `pay-${prevMonth1}-lbb-2`,
      monthKey: prevMonth1,
      lbbId: 'lbb-2',
      status: 'unpaid',
      paymentMethod: '',
      paidAt: '',
      note: 'Menunggu pencairan tanggal 28',
    },
  ];

  return {
    lbbs,
    students,
    schedules,
    payments,
  };
}
