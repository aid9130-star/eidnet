import { AccessCode, Student, Lesson, Exam, ExamQuestion, ExamResult, AdminStats } from '../types.ts';
import { initialCodes, initialLessons, initialExam, initialQuestions } from '../db/initialData.ts';

const STORAGE_KEYS = {
  ADMIN_PIN: 'tafawwoq_admin_pin',
  CODES: 'tafawwoq_codes',
  STUDENTS: 'tafawwoq_students',
  LESSONS: 'tafawwoq_lessons',
  EXAMS: 'tafawwoq_exams',
  QUESTIONS: 'tafawwoq_questions',
  RESULTS: 'tafawwoq_results',
  INITIALIZED: 'tafawwoq_data_initialized',
};

const DEFAULT_ADMIN_PIN = 'emam2025';

// Safe localStorage access
function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage set failed:', e);
  }
}

// Seed initial data once
export function initializeClientStore(): void {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_PIN)) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, DEFAULT_ADMIN_PIN);
    }

    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      // Initialize Codes
      const formattedCodes: AccessCode[] = initialCodes.map((c) => ({
        id: c.id,
        code: c.code,
        status: (c.status === 'active' ? 'unused' : c.status) as 'unused' | 'used' | 'disabled',
        usedByStudentName: c.usedByStudentName,
        usedByStudentPhone: c.usedByStudentPhone,
        usedAt: null,
        createdAt: new Date(c.createdAt).toISOString(),
        note: c.note,
      }));
      setItem(STORAGE_KEYS.CODES, formattedCodes);

      // Initialize Lessons
      const formattedLessons: Lesson[] = initialLessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        videoUrl: l.videoUrl,
        durationMinutes: l.durationMinutes,
        term: l.term,
        unit: l.unit,
        lessonNumber: l.lessonNumber,
        pdfAttachmentUrl: l.pdfAttachmentUrl,
        isPublished: l.isPublished,
        createdAt: new Date(l.createdAt).toISOString(),
      }));
      setItem(STORAGE_KEYS.LESSONS, formattedLessons);

      // Initialize Exam
      const formattedExams: Exam[] = [
        {
          id: initialExam.id,
          title: initialExam.title,
          description: initialExam.description,
          timeLimitMinutes: initialExam.timeLimitMinutes,
          maxAttempts: initialExam.maxAttempts,
          term: initialExam.term,
          unit: initialExam.unit,
          passingScorePercent: initialExam.passingScorePercent,
          isPublished: initialExam.isPublished,
          createdAt: new Date(initialExam.createdAt).toISOString(),
          questionsCount: initialQuestions.length,
          totalPoints: initialQuestions.reduce((sum, q) => sum + q.points, 0),
        },
      ];
      setItem(STORAGE_KEYS.EXAMS, formattedExams);

      // Initialize Questions
      setItem(STORAGE_KEYS.QUESTIONS, initialQuestions);

      // Empty Students & Results
      if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
        setItem(STORAGE_KEYS.STUDENTS, []);
      }
      if (!localStorage.getItem(STORAGE_KEYS.RESULTS)) {
        setItem(STORAGE_KEYS.RESULTS, []);
      }

      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  } catch (err) {
    console.error('Failed to initialize client store:', err);
  }
}

// Ensure store is ready immediately
initializeClientStore();

// ================= ADMIN AUTH =================
export function verifyAdminPinLocal(enteredPin: string): boolean {
  const currentPin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || DEFAULT_ADMIN_PIN;
  const cleanEntered = enteredPin.trim();
  // Allow configured PIN or master fallback PIN 'emam2025'
  return cleanEntered === currentPin.trim() || cleanEntered === DEFAULT_ADMIN_PIN;
}

export function changeAdminPinLocal(currentPin: string, newPin: string): { success: boolean; message?: string; error?: string } {
  const storedPin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || DEFAULT_ADMIN_PIN;
  if (currentPin.trim() !== storedPin.trim() && currentPin.trim() !== DEFAULT_ADMIN_PIN) {
    return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
  }
  if (!newPin.trim() || newPin.trim().length < 4) {
    return { success: false, error: 'كلمة المرور الجديدة يجب ألا تقل عن 4 خانات' };
  }

  localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, newPin.trim());
  return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
}

// ================= ACCESS CODES =================
export function getCodesLocal(): AccessCode[] {
  initializeClientStore();
  return getItem<AccessCode[]>(STORAGE_KEYS.CODES, []);
}

export function generateCodesLocal(amount: number, note?: string): AccessCode[] {
  const existing = getCodesLocal();
  const newCodes: AccessCode[] = [];
  const startId = existing.length ? Math.max(...existing.map((c) => c.id)) + 1 : 1;

  for (let i = 0; i < amount; i++) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codeStr = `TOP-${Math.floor(100 + Math.random() * 900)}-${randomHex}`;
    const newCode: AccessCode = {
      id: startId + i,
      code: codeStr,
      status: 'unused',
      usedByStudentName: null,
      usedByStudentPhone: null,
      usedAt: null,
      createdAt: new Date().toISOString(),
      note: note || 'كود طالب جديد',
    };
    newCodes.push(newCode);
  }

  const updated = [...newCodes, ...existing];
  setItem(STORAGE_KEYS.CODES, updated);
  return newCodes;
}

export function updateCodeLocal(id: number, status: 'unused' | 'used' | 'disabled', note?: string): AccessCode | null {
  const codes = getCodesLocal();
  const idx = codes.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  codes[idx].status = status;
  if (note !== undefined) codes[idx].note = note;
  setItem(STORAGE_KEYS.CODES, codes);
  return codes[idx];
}

export function deleteCodeLocal(id: number): boolean {
  const codes = getCodesLocal();
  const filtered = codes.filter((c) => c.id !== id);
  setItem(STORAGE_KEYS.CODES, filtered);
  return true;
}

// ================= STUDENT AUTH =================
export function studentLoginLocal(name: string, phone: string, code: string): Student {
  initializeClientStore();
  const cleanName = name.trim();
  const cleanPhone = phone.trim();
  const cleanCode = code.trim().toUpperCase();

  const codes = getCodesLocal();
  const codeIdx = codes.findIndex((c) => c.code.toUpperCase() === cleanCode);

  if (codeIdx === -1) {
    throw new Error('كود التفعيل غير صحيح أو غير موجود في سجلات المنصة');
  }

  const codeRec = codes[codeIdx];
  if (codeRec.status === 'disabled') {
    throw new Error('تم تعطيل هذا الكود، يرجى التواصل مع مستر إمام يوسف');
  }

  const students = getItem<Student[]>(STORAGE_KEYS.STUDENTS, []);

  // Check if code was already used
  if (codeRec.status === 'used') {
    // Check if the same student is logging in again
    const sameStudent = students.find(
      (s) => (s.phone === cleanPhone || s.name.toLowerCase() === cleanName.toLowerCase()) && s.codeUsed.toUpperCase() === cleanCode
    );

    if (sameStudent) {
      sameStudent.lastActiveAt = new Date().toISOString();
      setItem(STORAGE_KEYS.STUDENTS, students);
      return sameStudent;
    }

    throw new Error(`هذا الكود تم استخدامه مسبقاً من قِبل: ${codeRec.usedByStudentName || 'طالب آخر'}`);
  }

  // First time using this code
  codeRec.status = 'used';
  codeRec.usedByStudentName = cleanName;
  codeRec.usedByStudentPhone = cleanPhone;
  codeRec.usedAt = new Date().toISOString();
  setItem(STORAGE_KEYS.CODES, codes);

  const newStudent: Student = {
    id: students.length ? Math.max(...students.map((s) => s.id)) + 1 : 1,
    name: cleanName,
    phone: cleanPhone,
    codeUsed: cleanCode,
    sessionToken: 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
    grade: 'الصف الثالث الثانوي',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  students.push(newStudent);
  setItem(STORAGE_KEYS.STUDENTS, students);
  return newStudent;
}

export function getStudentsLocal(): Student[] {
  initializeClientStore();
  return getItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
}

// ================= LESSONS =================
export function getLessonsLocal(isAdmin = false): Lesson[] {
  initializeClientStore();
  const lessons = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, []);
  if (isAdmin) return lessons;
  return lessons.filter((l) => l.isPublished);
}

export function saveLessonLocal(lessonData: Partial<Lesson>): Lesson {
  const lessons = getLessonsLocal(true);
  const now = new Date().toISOString();

  if (lessonData.id) {
    const idx = lessons.findIndex((l) => l.id === lessonData.id);
    if (idx !== -1) {
      lessons[idx] = {
        ...lessons[idx],
        ...lessonData,
      } as Lesson;
      setItem(STORAGE_KEYS.LESSONS, lessons);
      return lessons[idx];
    }
  }

  const newId = lessons.length ? Math.max(...lessons.map((l) => l.id)) + 1 : 1;
  const newLesson: Lesson = {
    id: newId,
    title: lessonData.title || 'درس جديد',
    description: lessonData.description || '',
    videoUrl: lessonData.videoUrl || '',
    durationMinutes: Number(lessonData.durationMinutes) || 40,
    term: lessonData.term || 'الترم الأول',
    unit: lessonData.unit || 'Unit 1',
    lessonNumber: Number(lessonData.lessonNumber) || 1,
    pdfAttachmentUrl: lessonData.pdfAttachmentUrl || null,
    isPublished: lessonData.isPublished !== undefined ? lessonData.isPublished : true,
    createdAt: now,
  };

  lessons.push(newLesson);
  setItem(STORAGE_KEYS.LESSONS, lessons);
  return newLesson;
}

export function deleteLessonLocal(id: number): boolean {
  const lessons = getLessonsLocal(true);
  const filtered = lessons.filter((l) => l.id !== id);
  setItem(STORAGE_KEYS.LESSONS, filtered);
  return true;
}

// ================= EXAMS & QUESTIONS =================
export function createExamLocal(examData: Partial<Exam>, questionsList: Partial<ExamQuestion>[]): Exam {
  initializeClientStore();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS, []);
  const allQuestions = getItem<ExamQuestion[]>(STORAGE_KEYS.QUESTIONS, []);

  const newExamId = exams.length ? Math.max(...exams.map((e) => e.id)) + 1 : 1;
  const newExam: Exam = {
    id: newExamId,
    title: examData.title || 'اختبار جديد',
    description: examData.description || '',
    timeLimitMinutes: Number(examData.timeLimitMinutes) || 20,
    maxAttempts: Number(examData.maxAttempts) || 2,
    term: examData.term || 'الترم الأول',
    unit: examData.unit || 'Unit 1',
    passingScorePercent: Number(examData.passingScorePercent) || 60,
    isPublished: examData.isPublished !== undefined ? examData.isPublished : true,
    createdAt: new Date().toISOString(),
    questionsCount: questionsList.length,
    totalPoints: questionsList.reduce((sum, q) => sum + (Number(q.points) || 2), 0),
  };

  exams.push(newExam);
  setItem(STORAGE_KEYS.EXAMS, exams);

  const startQId = allQuestions.length ? Math.max(...allQuestions.map((q) => q.id)) + 1 : 1;
  const newQuestions: ExamQuestion[] = questionsList.map((q, idx) => ({
    id: startQId + idx,
    examId: newExamId,
    questionText: q.questionText || '',
    type: q.type || 'multiple_choice',
    options: q.options || [],
    correctOptionIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0,
    explanation: q.explanation || null,
    points: Number(q.points) || 2,
  }));

  setItem(STORAGE_KEYS.QUESTIONS, [...allQuestions, ...newQuestions]);
  return newExam;
}

export function deleteExamLocal(id: number): boolean {
  initializeClientStore();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS, []);
  setItem(STORAGE_KEYS.EXAMS, exams.filter((e) => e.id !== id));

  const questions = getItem<ExamQuestion[]>(STORAGE_KEYS.QUESTIONS, []);
  setItem(STORAGE_KEYS.QUESTIONS, questions.filter((q) => q.examId !== id));
  return true;
}

export function getExamsLocal(studentId?: number): Exam[] {
  initializeClientStore();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS, []);
  const questions = getItem<ExamQuestion[]>(STORAGE_KEYS.QUESTIONS, []);
  const results = getItem<ExamResult[]>(STORAGE_KEYS.RESULTS, []);

  return exams.map((exam) => {
    const examQuestions = questions.filter((q) => q.examId === exam.id);
    const userResults = studentId ? results.filter((r) => r.examId === exam.id && r.studentId === studentId) : [];
    const bestScore = userResults.length ? Math.max(...userResults.map((r) => r.scorePercent)) : undefined;

    return {
      ...exam,
      questionsCount: examQuestions.length,
      totalPoints: examQuestions.reduce((sum, q) => sum + (q.points || 1), 0),
      userAttemptsCount: userResults.length,
      bestScore,
    };
  });
}

export function getExamDetailsLocal(examId: number, isTeacher = false): { exam: Exam; questions: ExamQuestion[] } {
  initializeClientStore();
  const exams = getExamsLocal();
  const exam = exams.find((e) => e.id === examId);
  if (!exam) throw new Error('الاختبار غير موجود');

  const allQuestions = getItem<ExamQuestion[]>(STORAGE_KEYS.QUESTIONS, []);
  const questions = allQuestions.filter((q) => q.examId === examId);

  // If student is taking the exam, omit the correct answer and explanations until submitted
  const safeQuestions = isTeacher
    ? questions
    : questions.map((q) => ({
        ...q,
        correctOptionIndex: -1,
        explanation: null,
      }));

  return { exam, questions: safeQuestions };
}

export function submitExamLocal(
  examId: number,
  answers: Record<string, number>,
  studentId: number,
  studentName: string,
  timeSpentSeconds = 0
): {
  score: number;
  totalPossiblePoints: number;
  scorePercent: number;
  passed: boolean;
  attemptNumber: number;
  resultId: number;
  detailedAnswers: any[];
} {
  initializeClientStore();
  const exams = getExamsLocal();
  const exam = exams.find((e) => e.id === examId);
  if (!exam) throw new Error('الاختبار غير موجود');

  const allQuestions = getItem<ExamQuestion[]>(STORAGE_KEYS.QUESTIONS, []);
  const questions = allQuestions.filter((q) => q.examId === examId);

  const results = getItem<ExamResult[]>(STORAGE_KEYS.RESULTS, []);
  const prevAttempts = results.filter((r) => r.examId === examId && r.studentId === studentId);
  const attemptNumber = prevAttempts.length + 1;

  let earnedScore = 0;
  let totalPossible = 0;

  const detailedAnswers = questions.map((q) => {
    const chosenIndex = answers[q.id.toString()];
    const isCorrect = chosenIndex === q.correctOptionIndex;
    const pts = q.points || 2;
    totalPossible += pts;
    if (isCorrect) earnedScore += pts;

    return {
      questionId: q.id,
      questionText: q.questionText,
      options: q.options,
      chosenOptionIndex: chosenIndex,
      correctOptionIndex: q.correctOptionIndex,
      isCorrect,
      explanation: q.explanation,
      pointsEarned: isCorrect ? pts : 0,
      pointsPossible: pts,
    };
  });

  const scorePercent = totalPossible > 0 ? Math.round((earnedScore / totalPossible) * 100) : 0;
  const passed = scorePercent >= (exam.passingScorePercent || 60);

  const newResult: ExamResult = {
    id: results.length ? Math.max(...results.map((r) => r.id)) + 1 : 1,
    studentId,
    examId,
    studentName,
    studentPhone: '',
    score: earnedScore,
    totalPossiblePoints: totalPossible,
    scorePercent,
    timeSpentSeconds,
    answers,
    attemptNumber,
    passed,
    createdAt: new Date().toISOString(),
    examTitle: exam.title,
  };

  results.unshift(newResult);
  setItem(STORAGE_KEYS.RESULTS, results);

  return {
    score: earnedScore,
    totalPossiblePoints: totalPossible,
    scorePercent,
    passed,
    attemptNumber,
    resultId: newResult.id,
    detailedAnswers,
  };
}

export function getResultsLocal(studentId?: number): ExamResult[] {
  initializeClientStore();
  const results = getItem<ExamResult[]>(STORAGE_KEYS.RESULTS, []);
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS, []);

  const enriched = results.map((r) => {
    const exam = exams.find((e) => e.id === r.examId);
    return {
      ...r,
      examTitle: exam ? exam.title : r.examTitle || 'اختبار',
    };
  });

  if (studentId) {
    return enriched.filter((r) => r.studentId === studentId);
  }
  return enriched;
}

// ================= STATS =================
export function getStatsLocal(): AdminStats {
  initializeClientStore();
  const students = getItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
  const codes = getItem<AccessCode[]>(STORAGE_KEYS.CODES, []);
  const lessons = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, []);
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS, []);
  const results = getItem<ExamResult[]>(STORAGE_KEYS.RESULTS, []);

  const usedCodesCount = codes.filter((c) => c.status === 'used').length;
  const unusedCodesCount = codes.filter((c) => c.status === 'unused').length;

  const totalScorePercent = results.reduce((acc, r) => acc + (r.scorePercent || 0), 0);
  const averageScorePercent = results.length ? Math.round(totalScorePercent / results.length) : 0;

  return {
    totalStudents: students.length,
    totalCodes: codes.length,
    usedCodes: usedCodesCount,
    unusedCodes: unusedCodesCount,
    totalLessons: lessons.length,
    totalExams: exams.length,
    totalSubmissions: results.length,
    averageScorePercent,
  };
}

// ================= RESET =================
export function resetDataLocal(): void {
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  localStorage.removeItem(STORAGE_KEYS.CODES);
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.LESSONS);
  localStorage.removeItem(STORAGE_KEYS.EXAMS);
  localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
  localStorage.removeItem(STORAGE_KEYS.RESULTS);
  localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, DEFAULT_ADMIN_PIN);
  initializeClientStore();
}
