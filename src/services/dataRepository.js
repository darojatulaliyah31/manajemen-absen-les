import { supabase, isSupabaseConfigured } from './supabaseClient';

function toIsoOrNull(val) {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toLocalDateTimeValue(val) {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function mapLbbRow(row) {
  return {
    id: row.id,
    name: row.name,
    attendanceMethod: row.attendance_method,
    attendanceUrl: row.attendance_url || '',
    contact: row.contact || '',
    notes: row.notes || '',
  };
}

function toLbbDb(lbb) {
  return {
    id: lbb.id,
    name: lbb.name,
    attendance_method: lbb.attendanceMethod || 'manual',
    attendance_url: lbb.attendanceUrl || '',
    contact: lbb.contact || '',
    notes: lbb.notes || '',
  };
}

function toStudentDb(stu) {
  return {
    id: stu.id,
    lbb_id: stu.lbbId,
    name: stu.name,
    grade: stu.grade || '',
    address: stu.address || '',
    notes: stu.notes || '',
  };
}

function mapScheduleRow(row) {
  return {
    id: row.id,
    date: String(row.lesson_date).slice(0, 10),
    time: row.lesson_time,
    studentId: row.student_id,
    lbbId: row.lbb_id,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    fee: Number(row.fee) || 0,
    attendanceStatus: row.attendance_status || null,
    attendanceUpdatedAt: row.attendance_updated_at || null,
    gformSubmitted: Boolean(row.gform_submitted),
    gformSubmittedAt: row.gform_submitted_at || null,
    notes: row.notes || '',
  };
}

function toScheduleDb(sch) {
  return {
    id: sch.id,
    lesson_date: sch.date,
    lesson_time: sch.time,
    student_id: sch.studentId,
    lbb_id: sch.lbbId,
    subject_id: sch.subjectId,
    subject_name: sch.subjectName,
    fee: Number(sch.fee) || 0,
    attendance_status: sch.attendanceStatus || null,
    attendance_updated_at: toIsoOrNull(sch.attendanceUpdatedAt),
    gform_submitted: Boolean(sch.gformSubmitted),
    gform_submitted_at: toIsoOrNull(sch.gformSubmittedAt),
    notes: sch.notes || '',
  };
}

function mapPaymentRow(row) {
  return {
    id: row.id,
    monthKey: row.month_key,
    lbbId: row.lbb_id,
    status: row.status,
    paymentMethod: row.payment_method || '',
    paidAt: toLocalDateTimeValue(row.paid_at),
    note: row.note || '',
  };
}

function toPaymentDb(p) {
  return {
    id: p.id,
    month_key: p.monthKey,
    lbb_id: p.lbbId,
    status: p.status || 'unpaid',
    payment_method: p.paymentMethod || '',
    paid_at: toIsoOrNull(p.paidAt),
    note: p.note || '',
  };
}

export async function fetchAllFromSupabase() {
  if (!isSupabaseConfigured) return null;

  const [lbbsRes, stuRes, subRes, schRes, payRes] = await Promise.all([
    supabase.from('lbbs').select('*').order('name'),
    supabase.from('students').select('*').order('name'),
    supabase.from('student_subjects').select('*'),
    supabase
      .from('schedules')
      .select('*')
      .order('lesson_date', { ascending: false })
      .order('lesson_time', { ascending: false }),
    supabase.from('lbb_payments').select('*'),
  ]);

  const firstErr =
    lbbsRes.error || stuRes.error || subRes.error || schRes.error || payRes.error;
  if (firstErr) throw firstErr;

  const subjectsByStudent = {};
  (subRes.data || []).forEach((sub) => {
    if (!subjectsByStudent[sub.student_id]) subjectsByStudent[sub.student_id] = [];
    subjectsByStudent[sub.student_id].push({
      id: sub.id,
      name: sub.name,
      fee: Number(sub.fee) || 0,
      weeklySchedules: Array.isArray(sub.weekly_schedules) ? sub.weekly_schedules : [],
    });
  });

  return {
    lbbs: (lbbsRes.data || []).map(mapLbbRow),
    students: (stuRes.data || []).map((stu) => ({
      id: stu.id,
      lbbId: stu.lbb_id,
      name: stu.name,
      grade: stu.grade || '',
      address: stu.address || '',
      notes: stu.notes || '',
      subjects: subjectsByStudent[stu.id] || [],
    })),
    schedules: (schRes.data || []).map(mapScheduleRow),
    payments: (payRes.data || []).map(mapPaymentRow),
  };
}

export async function upsertLbbRemote(lbb) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('lbbs').upsert(toLbbDb(lbb));
  if (error) throw error;
}

export async function deleteLbbRemote(lbbId) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('lbbs').delete().eq('id', lbbId);
  if (error) throw error;
}

export async function upsertStudentRemote(student) {
  if (!isSupabaseConfigured) return;
  const { error: stuErr } = await supabase
    .from('students')
    .upsert(toStudentDb(student));
  if (stuErr) throw stuErr;

  const { error: delErr } = await supabase
    .from('student_subjects')
    .delete()
    .eq('student_id', student.id);
  if (delErr) throw delErr;

  if (student.subjects?.length) {
    const rows = student.subjects.map((sub) => ({
      id: sub.id,
      student_id: student.id,
      name: sub.name,
      fee: Number(sub.fee) || 0,
      weekly_schedules: sub.weeklySchedules || [],
    }));
    const { error: insErr } = await supabase.from('student_subjects').insert(rows);
    if (insErr) throw insErr;
  }
}

export async function deleteStudentRemote(studentId) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('students').delete().eq('id', studentId);
  if (error) throw error;
}

export async function upsertScheduleRemote(schedule) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('schedules').upsert(toScheduleDb(schedule));
  if (error) throw error;
}

export async function bulkInsertSchedulesRemote(schedules) {
  if (!isSupabaseConfigured || !schedules.length) return;
  const { error } = await supabase
    .from('schedules')
    .upsert(schedules.map(toScheduleDb));
  if (error) throw error;
}

export async function deleteScheduleRemote(scheduleId) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);
  if (error) throw error;
}

export async function upsertPaymentRemote(payment) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('lbb_payments')
    .upsert(toPaymentDb(payment), { onConflict: 'month_key,lbb_id' });
  if (error) throw error;
}

export async function importDatasetToSupabase(dataset) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi pada .env');
  }

  if (dataset.lbbs?.length) {
    const { error } = await supabase
      .from('lbbs')
      .upsert(dataset.lbbs.map(toLbbDb));
    if (error) throw error;
  }

  if (dataset.students?.length) {
    const { error: stuErr } = await supabase
      .from('students')
      .upsert(dataset.students.map(toStudentDb));
    if (stuErr) throw stuErr;

    const studentIds = dataset.students.map((s) => s.id);
    const { error: delErr } = await supabase
      .from('student_subjects')
      .delete()
      .in('student_id', studentIds);
    if (delErr) throw delErr;

    const allSubjects = dataset.students.flatMap((stu) =>
      (stu.subjects || []).map((sub) => ({
        id: sub.id,
        student_id: stu.id,
        name: sub.name,
        fee: Number(sub.fee) || 0,
        weekly_schedules: sub.weeklySchedules || [],
      }))
    );
    if (allSubjects.length) {
      const { error: subErr } = await supabase
        .from('student_subjects')
        .insert(allSubjects);
      if (subErr) throw subErr;
    }
  }

  if (dataset.schedules?.length) {
    const { error } = await supabase
      .from('schedules')
      .upsert(dataset.schedules.map(toScheduleDb));
    if (error) throw error;
  }

  if (dataset.payments?.length) {
    const { error } = await supabase
      .from('lbb_payments')
      .upsert(dataset.payments.map(toPaymentDb), { onConflict: 'month_key,lbb_id' });
    if (error) throw error;
  }
}
