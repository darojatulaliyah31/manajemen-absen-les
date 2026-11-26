-- ============================================================================
-- Schema Database Supabase (PostgreSQL) untuk TutorTrack - Manajemen Absen Les
-- Cara pakai: Salin seluruh isi file ini -> Supabase SQL Editor -> Klik RUN
-- ============================================================================

-- 1. Tabel Lembaga Les (LBB)
create table if not exists public.lbbs (
  id text primary key,
  name text not null,
  attendance_method text not null default 'manual'
    check (attendance_method in ('manual', 'google_form', 'website')),
  attendance_url text not null default '',
  contact text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- 2. Tabel Siswa
create table if not exists public.students (
  id text primary key,
  lbb_id text not null references public.lbbs(id) on delete restrict,
  name text not null,
  grade text not null default '',
  address text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- 3. Tabel Mata Pelajaran per Siswa (Multi-Mapel + Jadwal Mingguan)
create table if not exists public.student_subjects (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  name text not null,
  fee integer not null default 0,
  weekly_schedules jsonb not null default '[]'::jsonb
);

-- 4. Tabel Jadwal Les & Absensi (termasuk pengunci anti-double Google Form)
create table if not exists public.schedules (
  id text primary key,
  lesson_date date not null,
  lesson_time text not null,
  student_id text not null references public.students(id) on delete cascade,
  lbb_id text not null references public.lbbs(id) on delete restrict,
  subject_id text not null,
  subject_name text not null,
  fee integer not null default 0,
  attendance_status text null
    check (attendance_status in ('hadir', 'siswa_sakit', 'siswa_izin', 'tutor_sakit', 'tutor_izin', 'reschedule')),
  attendance_updated_at timestamptz null,
  gform_submitted boolean not null default false,
  gform_submitted_at timestamptz null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_students_lbb_id on public.students (lbb_id);
create index if not exists idx_student_subjects_student_id on public.student_subjects (student_id);
create index if not exists idx_schedules_date on public.schedules (lesson_date);
create index if not exists idx_schedules_lbb on public.schedules (lbb_id);
create index if not exists idx_schedules_student_id on public.schedules (student_id);

-- 5. Tabel Rekap Pembayaran Fee oleh LBB per Bulan
create table if not exists public.lbb_payments (
  id text primary key,
  month_key char(7) not null,
  lbb_id text not null references public.lbbs(id) on delete cascade,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  payment_method text not null default '',
  paid_at timestamptz null,
  note text not null default '',
  unique (month_key, lbb_id)
);

create index if not exists idx_lbb_payments_lbb_id on public.lbb_payments (lbb_id);

-- ============================================================================
-- Keamanan: Row Level Security (RLS) - Hanya Admin Tutor yang Login yang Bisa Akses
-- ============================================================================
alter table public.lbbs enable row level security;
alter table public.students enable row level security;
alter table public.student_subjects enable row level security;
alter table public.schedules enable row level security;
alter table public.lbb_payments enable row level security;

drop policy if exists "Tutor access lbbs" on public.lbbs;
create policy "Tutor access lbbs"
  on public.lbbs for all to authenticated using (true) with check (true);

drop policy if exists "Tutor access students" on public.students;
create policy "Tutor access students"
  on public.students for all to authenticated using (true) with check (true);

drop policy if exists "Tutor access student_subjects" on public.student_subjects;
create policy "Tutor access student_subjects"
  on public.student_subjects for all to authenticated using (true) with check (true);

drop policy if exists "Tutor access schedules" on public.schedules;
create policy "Tutor access schedules"
  on public.schedules for all to authenticated using (true) with check (true);

drop policy if exists "Tutor access lbb_payments" on public.lbb_payments;
create policy "Tutor access lbb_payments"
  on public.lbb_payments for all to authenticated using (true) with check (true);
