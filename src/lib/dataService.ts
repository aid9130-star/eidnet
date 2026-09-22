import * as clientStore from './clientStore.ts';
import { AccessCode, Student, Lesson, Exam, ExamQuestion, ExamResult, AdminStats } from '../types.ts';

const FETCH_TIMEOUT_MS = 2000;

async function tryFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timer);

    // If server returned non-ok (like 404 or 405 on Vercel static), or returned HTML page
    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }

    return (await res.json()) as T;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ================= ADMIN AUTH =================
export async function verifyAdminPin(enteredPin: string): Promise<{ success: boolean; token: string }> {
  const cleanPin = enteredPin.trim();
  if (!cleanPin) {
    throw new Error('يرجى إدخال رمز الدخول السري أو كلمة المرور');
  }

  // 1. Try server endpoint
  let serverRejection: string | null = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch('/api/admin/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: cleanPin }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data && (data.success || data.token)) {
        const token = data.token || 'tafawwoq_teacher_master_authenticated';
        sessionStorage.setItem('tafawwoq_admin_auth', token);
        return { success: true, token };
      }
      if (res.status === 401 || res.status === 400) {
        serverRejection = data.error || data.message || 'كلمة المرور أو رمز الدخول غير صحيح';
      }
    }
  } catch {
    // Network error or offline -> proceed to client storage fallback
  }

  // If server is active and explicitly rejected the password, abort immediately
  if (serverRejection) {
    throw new Error(serverRejection);
  }

  // 2. Fallback to client storage
  const isMatch = clientStore.verifyAdminPinLocal(cleanPin);
  if (!isMatch) {
    throw new Error('كلمة المرور أو رمز الدخول غير صحيح');
  }

  const token = 'tafawwoq_local_admin_' + Date.now();
  sessionStorage.setItem('tafawwoq_admin_auth', token);
  return { success: true, token };
}

export async function changeAdminPin(currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
  const cleanCurrent = currentPin.trim();
  const cleanNew = newPin.trim();

  if (!cleanNew || cleanNew.length < 4) {
    throw new Error('كلمة المرور الجديدة يجب ألا تقل عن 4 خانات');
  }

  // 1. Try server
  let serverRejection: string | null = null;
  let serverHandled = false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch('/api/admin/change-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPin: cleanCurrent, newPin: cleanNew }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data) {
        serverHandled = true;
        // Keep client store strictly in sync with new password
        clientStore.setAdminPinLocal(cleanNew);
        return { success: true, message: data.message || 'تم تحديث كلمة مرور المشرف بنجاح' };
      }
      if (res.status === 400 || res.status === 401) {
        serverRejection = data.error || data.message || 'كلمة المرور الحالية غير صحيحة';
      }
    }
  } catch {
    // Network error or offline -> proceed to local store
  }

  // If server is active and explicitly rejected the change, abort immediately
  if (serverRejection) {
    throw new Error(serverRejection);
  }

  if (serverHandled) {
    return { success: true, message: 'تم تحديث كلمة مرور المشرف بنجاح' };
  }

  // 2. Client fallback
  const localRes = clientStore.changeAdminPinLocal(cleanCurrent, cleanNew);
  if (!localRes.success) {
    throw new Error(localRes.error || 'فشل تغيير كلمة المرور');
  }

  return { success: true, message: localRes.message || 'تم تحديث كلمة مرور المشرف بنجاح' };
}

export function isAdminPinCustomized(): boolean {
  return clientStore.isAdminPinCustomized();
}

// ================= STUDENT AUTH =================
export async function studentLogin(name: string, phone: string, code: string): Promise<Student> {
  // 1. Try server
  const serverRes = await tryFetchJson<{ success: boolean; student: Student }>('/api/student/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), phone: phone.trim(), code: code.trim() }),
  });

  if (serverRes && serverRes.success && serverRes.student) {
    return serverRes.student;
  }

  // 2. Local fallback
  return clientStore.studentLoginLocal(name, phone, code);
}

// ================= STATS =================
export async function getStats(): Promise<AdminStats> {
  const serverRes = await tryFetchJson<AdminStats>('/api/admin/stats');
  if (serverRes) return serverRes;
  return clientStore.getStatsLocal();
}

// ================= CODES =================
export async function getCodes(): Promise<AccessCode[]> {
  const serverRes = await tryFetchJson<AccessCode[]>('/api/admin/codes');
  if (serverRes && Array.isArray(serverRes)) return serverRes;
  return clientStore.getCodesLocal();
}

export async function generateCodes(amount: number, note?: string): Promise<AccessCode[]> {
  const serverRes = await tryFetchJson<AccessCode[]>('/api/admin/codes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, note }),
  });

  if (serverRes && Array.isArray(serverRes)) {
    return serverRes;
  }

  return clientStore.generateCodesLocal(amount, note);
}

export async function updateCode(id: number, status: 'unused' | 'used' | 'disabled', note?: string): Promise<AccessCode | null> {
  const serverRes = await tryFetchJson<AccessCode>(`/api/admin/codes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
  });

  if (serverRes) return serverRes;
  return clientStore.updateCodeLocal(id, status, note);
}

export async function deleteCode(id: number): Promise<boolean> {
  const serverRes = await tryFetchJson<{ success: boolean }>(`/api/admin/codes/${id}`, {
    method: 'DELETE',
  });

  clientStore.deleteCodeLocal(id);
  return serverRes ? serverRes.success : true;
}

// ================= LESSONS =================
export async function getLessons(isAdmin = false): Promise<Lesson[]> {
  const serverRes = await tryFetchJson<Lesson[]>(`/api/lessons${isAdmin ? '?isAdmin=true' : ''}`);
  if (serverRes && Array.isArray(serverRes)) return serverRes;
  return clientStore.getLessonsLocal(isAdmin);
}

export async function saveLesson(lesson: Partial<Lesson>): Promise<Lesson> {
  const isEditing = !!lesson.id;
  const url = isEditing ? `/api/lessons/${lesson.id}` : '/api/lessons';
  const method = isEditing ? 'PUT' : 'POST';

  const serverRes = await tryFetchJson<Lesson>(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lesson),
  });

  const localSaved = clientStore.saveLessonLocal(lesson);
  return serverRes || localSaved;
}

export async function deleteLesson(id: number): Promise<boolean> {
  const serverRes = await tryFetchJson<{ success: boolean }>(`/api/lessons/${id}`, {
    method: 'DELETE',
  });

  clientStore.deleteLessonLocal(id);
  return serverRes ? serverRes.success : true;
}

// ================= EXAMS =================
export async function getExams(studentId?: number): Promise<Exam[]> {
  const url = studentId ? `/api/exams?studentId=${studentId}` : '/api/exams';
  const serverRes = await tryFetchJson<Exam[]>(url);
  if (serverRes && Array.isArray(serverRes)) return serverRes;
  return clientStore.getExamsLocal(studentId);
}

export async function createExam(exam: Partial<Exam>, questions: Partial<ExamQuestion>[]): Promise<Exam> {
  const serverRes = await tryFetchJson<Exam>('/api/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exam, questions }),
  });

  const localSaved = clientStore.createExamLocal(exam, questions);
  return serverRes || localSaved;
}

export async function deleteExam(id: number): Promise<boolean> {
  const serverRes = await tryFetchJson<{ success: boolean }>(`/api/exams/${id}`, {
    method: 'DELETE',
  });

  clientStore.deleteExamLocal(id);
  return serverRes ? serverRes.success : true;
}

export async function getExamDetails(examId: number, isTeacher = false): Promise<{ exam: Exam; questions: ExamQuestion[] }> {
  const serverRes = await tryFetchJson<any>(`/api/exams/${examId}${isTeacher ? '?isTeacher=true' : ''}`);
  if (serverRes) {
    if (serverRes.exam && Array.isArray(serverRes.questions)) {
      return serverRes;
    }
    if (Array.isArray(serverRes.questions)) {
      const { questions, ...exam } = serverRes;
      return { exam: exam as Exam, questions };
    }
  }
  return clientStore.getExamDetailsLocal(examId, isTeacher);
}

export async function submitExam(
  examId: number,
  answers: Record<string, number>,
  studentId: number,
  studentName: string,
  timeSpentSeconds = 0
): Promise<{
  score: number;
  totalPossiblePoints: number;
  scorePercent: number;
  passed: boolean;
  attemptNumber: number;
  resultId: number;
  detailedAnswers: any[];
}> {
  const serverRes = await tryFetchJson<any>(`/api/exams/${examId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, studentId, timeSpentSeconds }),
  });

  if (serverRes && serverRes.scorePercent !== undefined) {
    return serverRes;
  }

  return clientStore.submitExamLocal(examId, answers, studentId, studentName, timeSpentSeconds);
}

// ================= STUDENTS & RESULTS =================
export async function getStudents(): Promise<Student[]> {
  const serverRes = await tryFetchJson<Student[]>('/api/admin/students');
  if (serverRes && Array.isArray(serverRes)) return serverRes;
  return clientStore.getStudentsLocal();
}

export async function getResults(studentId?: number): Promise<ExamResult[]> {
  const url = studentId ? `/api/student/${studentId}/results` : '/api/admin/results';
  const serverRes = await tryFetchJson<ExamResult[]>(url);
  if (serverRes && Array.isArray(serverRes)) return serverRes;
  return clientStore.getResultsLocal(studentId);
}

export async function resetData(pin: string): Promise<boolean> {
  const serverRes = await tryFetchJson<{ success: boolean }>('/api/admin/reset-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });

  if (!serverRes) {
    const isValid = clientStore.verifyAdminPinLocal(pin);
    if (!isValid) {
      throw new Error('رمز الأمان غير مصرح به');
    }
  }

  clientStore.resetDataLocal();
  return true;
}
