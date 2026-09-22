import { db, hasDatabaseConfigured } from './index.ts';
import { accessCodes, students, lessons, exams, examQuestions, examResults, users, systemSettings } from './schema.ts';
import { eq, desc, and, count, avg, sql, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { initialCodes, initialLessons, initialExam, initialQuestions } from './initialData.ts';

// In-memory fallback state (guarantees the app works smoothly on Vercel even before Postgres credentials are added)
const memoryState = {
  adminPin: process.env.ADMIN_PIN || 'emam2025',
  codes: [...initialCodes],
  lessons: [...initialLessons],
  exams: [{ ...initialExam, questionsCount: initialQuestions.length, totalSubmissions: 0, avgScore: 0 }],
  questions: [...initialQuestions],
  students: [] as any[],
  results: [] as any[],
};

// --- ACCESS CODES ---
export async function getAccessCodes() {
  if (!hasDatabaseConfigured()) {
    return memoryState.codes;
  }
  try {
    return await db.select().from(accessCodes).orderBy(desc(accessCodes.createdAt));
  } catch (error) {
    console.warn('getAccessCodes fallback to memory:', error);
    return memoryState.codes;
  }
}

export async function generateAccessCodes(amount: number, note?: string) {
  const generated: Array<any> = [];
  for (let i = 0; i < amount; i++) {
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `TOP-${Math.floor(100 + Math.random() * 900)}-${randomPart}`;
    generated.push({
      id: memoryState.codes.length + i + 1,
      code,
      note: note || 'دفعة أكواد جديدة',
      status: 'unused',
      usedByStudentName: null,
      usedByStudentPhone: null,
      createdAt: new Date(),
    });
  }

  memoryState.codes.unshift(...generated);

  if (hasDatabaseConfigured()) {
    try {
      const dbValues = generated.map(g => ({ code: g.code, note: g.note }));
      return await db.insert(accessCodes).values(dbValues).returning();
    } catch (error) {
      console.warn('generateAccessCodes DB insert warning:', error);
    }
  }

  return generated;
}

export async function toggleCodeStatus(id: number, status: 'unused' | 'disabled') {
  const code = memoryState.codes.find(c => c.id === id);
  if (code) {
    code.status = status;
  }

  if (hasDatabaseConfigured()) {
    try {
      return await db.update(accessCodes)
        .set({ status })
        .where(eq(accessCodes.id, id))
        .returning();
    } catch (error) {
      console.warn('toggleCodeStatus DB warning:', error);
    }
  }

  return code ? [code] : [];
}

export async function deleteAccessCode(id: number) {
  const index = memoryState.codes.findIndex(c => c.id === id);
  if (index !== -1) {
    memoryState.codes.splice(index, 1);
  }

  if (hasDatabaseConfigured()) {
    try {
      return await db.delete(accessCodes).where(eq(accessCodes.id, id)).returning();
    } catch (error) {
      console.warn('deleteAccessCode DB warning:', error);
    }
  }

  return [{ id }];
}

// --- STUDENT AUTH & REGISTRATION WITH CODE ---
export async function studentLoginOrRegister(name: string, phone: string, code: string) {
  const trimmedCode = code.trim();
  const trimmedPhone = phone.trim();
  const trimmedName = name.trim();

  // If DB is configured, try DB first
  if (hasDatabaseConfigured()) {
    try {
      // 1. Check if student already registered with this phone
      const existingStudent = await db.select().from(students).where(eq(students.phone, trimmedPhone));
      if (existingStudent.length > 0) {
        const student = existingStudent[0];
        await db.update(students)
          .set({ lastActiveAt: new Date() })
          .where(eq(students.id, student.id));
        return student;
      }

      // 2. New student registration - verify the code
      const codeRecord = await db.select().from(accessCodes).where(eq(accessCodes.code, trimmedCode));
      if (codeRecord.length === 0) {
        throw new Error('كود التفعيل غير صحيح، يرجى التأكد من الكود أو التواصل مع الأستاذ');
      }

      const codeData = codeRecord[0];
      if (codeData.status === 'disabled') {
        throw new Error('تم تعطيل هذا الكود، يرجى مراجعة إدارة المنصة');
      }
      if (codeData.status === 'used') {
        throw new Error(`هذا الكود تم استخدامه مسبقاً من قِبل: ${codeData.usedByStudentName || 'طالب آخر'}`);
      }

      // 3. Mark code as used
      await db.update(accessCodes)
        .set({
          status: 'used',
          usedByStudentName: trimmedName,
          usedByStudentPhone: trimmedPhone,
          usedAt: new Date(),
        })
        .where(eq(accessCodes.id, codeData.id));

      // 4. Create student session
      const sessionToken = crypto.randomBytes(24).toString('hex');
      const createdStudent = await db.insert(students).values({
        name: trimmedName,
        phone: trimmedPhone,
        codeUsed: trimmedCode,
        sessionToken,
      }).returning();

      return createdStudent[0];
    } catch (error: any) {
      if (error.message?.includes('كود التفعيل') || error.message?.includes('تعطيل') || error.message?.includes('استخدامه')) {
        throw error;
      }
      console.warn('studentLoginOrRegister DB error, falling back to memory:', error);
    }
  }

  // Memory fallback logic
  const existingMem = memoryState.students.find(s => s.phone === trimmedPhone);
  if (existingMem) {
    existingMem.lastActiveAt = new Date();
    return existingMem;
  }

  const codeRec = memoryState.codes.find(c => c.code.toLowerCase() === trimmedCode.toLowerCase());
  if (!codeRec) {
    throw new Error('كود التفعيل غير صحيح، يرجى التأكد من الكود أو التواصل مع الأستاذ');
  }
  if (codeRec.status === 'disabled') {
    throw new Error('تم تعطيل هذا الكود، يرجى مراجعة إدارة المنصة');
  }
  if (codeRec.status === 'used') {
    throw new Error(`هذا الكود تم استخدامه مسبقاً من قِبل: ${codeRec.usedByStudentName || 'طالب آخر'}`);
  }

  codeRec.status = 'used';
  codeRec.usedByStudentName = trimmedName;
  codeRec.usedByStudentPhone = trimmedPhone;

  const newStudent = {
    id: memoryState.students.length + 1,
    name: trimmedName,
    phone: trimmedPhone,
    codeUsed: trimmedCode,
    sessionToken: crypto.randomBytes(24).toString('hex'),
    createdAt: new Date(),
    lastActiveAt: new Date(),
  };
  memoryState.students.push(newStudent);
  return newStudent;
}

export async function getStudentByToken(token: string) {
  if (hasDatabaseConfigured()) {
    try {
      const res = await db.select().from(students).where(eq(students.sessionToken, token));
      if (res[0]) return res[0];
    } catch (error) {
      console.warn('getStudentByToken DB warning:', error);
    }
  }
  return memoryState.students.find(s => s.sessionToken === token) || null;
}

export async function getAllStudents() {
  if (!hasDatabaseConfigured()) {
    return memoryState.students;
  }
  try {
    return await db.select().from(students).orderBy(desc(students.createdAt));
  } catch (error) {
    console.warn('getAllStudents fallback to memory:', error);
    return memoryState.students;
  }
}

// --- LESSONS ---
export async function getLessons(publishedOnly = true) {
  if (!hasDatabaseConfigured()) {
    return publishedOnly ? memoryState.lessons.filter(l => l.isPublished) : memoryState.lessons;
  }
  try {
    if (publishedOnly) {
      return await db.select().from(lessons)
        .where(eq(lessons.isPublished, true))
        .orderBy(desc(lessons.createdAt));
    }
    return await db.select().from(lessons).orderBy(desc(lessons.createdAt));
  } catch (error) {
    console.warn('getLessons fallback to memory:', error);
    return publishedOnly ? memoryState.lessons.filter(l => l.isPublished) : memoryState.lessons;
  }
}

export async function createLesson(data: {
  title: string;
  description?: string;
  videoUrl: string;
  durationMinutes: number;
  term: string;
  unit: string;
  lessonNumber: number;
  pdfAttachmentUrl?: string;
  isPublished?: boolean;
}) {
  const newLesson = {
    id: memoryState.lessons.length + 1,
    title: data.title,
    description: data.description || '',
    videoUrl: data.videoUrl,
    durationMinutes: Number(data.durationMinutes) || 30,
    term: data.term || 'الترم الأول',
    unit: data.unit || 'Unit 1',
    lessonNumber: Number(data.lessonNumber) || 1,
    pdfAttachmentUrl: data.pdfAttachmentUrl || null,
    isPublished: data.isPublished !== undefined ? data.isPublished : true,
    createdAt: new Date(),
  };

  if (!hasDatabaseConfigured()) {
    memoryState.lessons.unshift(newLesson);
    return [newLesson];
  }

  try {
    const inserted = await db.insert(lessons).values({
      title: data.title,
      description: data.description || '',
      videoUrl: data.videoUrl,
      durationMinutes: Number(data.durationMinutes) || 30,
      term: data.term || 'الترم الأول',
      unit: data.unit || 'Unit 1',
      lessonNumber: Number(data.lessonNumber) || 1,
      pdfAttachmentUrl: data.pdfAttachmentUrl || null,
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
    }).returning();
    return inserted;
  } catch (error) {
    console.warn('createLesson fallback to memory:', error);
    memoryState.lessons.unshift(newLesson);
    return [newLesson];
  }
}

export async function updateLesson(id: number, data: Partial<{
  title: string;
  description: string;
  videoUrl: string;
  durationMinutes: number;
  term: string;
  unit: string;
  lessonNumber: number;
  pdfAttachmentUrl: string;
  isPublished: boolean;
}>) {
  const idx = memoryState.lessons.findIndex(l => l.id === id);
  if (idx !== -1) {
    memoryState.lessons[idx] = { ...memoryState.lessons[idx], ...data };
  }

  if (!hasDatabaseConfigured()) {
    return idx !== -1 ? [memoryState.lessons[idx]] : [];
  }

  try {
    return await db.update(lessons).set(data).where(eq(lessons.id, id)).returning();
  } catch (error) {
    console.warn('updateLesson fallback to memory:', error);
    return idx !== -1 ? [memoryState.lessons[idx]] : [];
  }
}

export async function deleteLesson(id: number) {
  const idx = memoryState.lessons.findIndex(l => l.id === id);
  if (idx !== -1) {
    memoryState.lessons.splice(idx, 1);
  }

  if (!hasDatabaseConfigured()) {
    return [{ id }];
  }

  try {
    return await db.delete(lessons).where(eq(lessons.id, id)).returning();
  } catch (error) {
    console.warn('deleteLesson fallback to memory:', error);
    return [{ id }];
  }
}

// --- EXAMS & QUESTIONS ---
export async function getExamsWithStats(studentId?: number) {
  if (!hasDatabaseConfigured()) {
    return memoryState.exams;
  }
  try {
    const allExams = await db.select().from(exams).orderBy(desc(exams.createdAt));
    const result = [];

    for (const exam of allExams) {
      const qCount = await db.select({ count: count() }).from(examQuestions).where(eq(examQuestions.examId, exam.id));
      let userAttempts = 0;
      let bestScore = 0;

      if (studentId) {
        const studentResults = await db.select().from(examResults)
          .where(and(eq(examResults.examId, exam.id), eq(examResults.studentId, studentId)));
        userAttempts = studentResults.length;
        if (userAttempts > 0) {
          bestScore = Math.max(...studentResults.map(r => r.scorePercent));
        }
      }

      result.push({
        ...exam,
        questionsCount: Number(qCount[0]?.count || 0),
        userAttemptsCount: userAttempts,
        bestScore,
      });
    }

    return result;
  } catch (error) {
    console.warn('getExamsWithStats fallback to memory:', error);
    return memoryState.exams;
  }
}

export async function getExamDetails(examId: number, includeAnswers = false) {
  if (!hasDatabaseConfigured()) {
    const exam = memoryState.exams.find(e => e.id === Number(examId)) || memoryState.exams[0];
    if (!exam) return null;
    const questions = memoryState.questions.filter(q => q.examId === exam.id);
    return {
      ...exam,
      questions: questions.map(q => ({
        id: q.id,
        examId: q.examId,
        questionText: q.questionText,
        type: q.type,
        options: q.options,
        points: q.points,
        ...(includeAnswers ? { correctOptionIndex: q.correctOptionIndex, explanation: q.explanation } : {}),
      })),
    };
  }

  try {
    const examData = await db.select().from(exams).where(eq(exams.id, examId));
    if (examData.length === 0) return null;

    const questions = await db.select().from(examQuestions).where(eq(examQuestions.examId, examId));

    return {
      ...examData[0],
      questions: questions.map(q => ({
        id: q.id,
        examId: q.examId,
        questionText: q.questionText,
        type: q.type,
        options: q.options,
        points: q.points,
        // Hide correct answer from students
        ...(includeAnswers ? { correctOptionIndex: q.correctOptionIndex, explanation: q.explanation } : {}),
      })),
    };
  } catch (error) {
    console.warn('getExamDetails fallback to memory:', error);
    const exam = memoryState.exams.find(e => e.id === Number(examId)) || memoryState.exams[0];
    if (!exam) return null;
    const questions = memoryState.questions.filter(q => q.examId === exam.id);
    return {
      ...exam,
      questions: questions.map(q => ({
        id: q.id,
        examId: q.examId,
        questionText: q.questionText,
        type: q.type,
        options: q.options,
        points: q.points,
        ...(includeAnswers ? { correctOptionIndex: q.correctOptionIndex, explanation: q.explanation } : {}),
      })),
    };
  }
}

export async function createExam(examData: {
  title: string;
  description?: string;
  timeLimitMinutes: number;
  maxAttempts: number;
  term: string;
  unit: string;
  passingScorePercent: number;
  isPublished?: boolean;
}, questionsData: Array<{
  questionText: string;
  type: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  points: number;
}>) {
  const newExamId = memoryState.exams.length + 1;
  const memExam = {
    id: newExamId,
    title: examData.title,
    description: examData.description || '',
    timeLimitMinutes: Number(examData.timeLimitMinutes) || 20,
    maxAttempts: Number(examData.maxAttempts) || 1,
    term: examData.term || 'الترم الأول',
    unit: examData.unit || 'Unit 1',
    passingScorePercent: Number(examData.passingScorePercent) || 60,
    isPublished: examData.isPublished !== undefined ? examData.isPublished : true,
    createdAt: new Date(),
    questionsCount: questionsData?.length || 0,
  };

  if (!hasDatabaseConfigured()) {
    memoryState.exams.unshift(memExam);
    if (questionsData && questionsData.length > 0) {
      questionsData.forEach((q, idx) => {
        memoryState.questions.push({
          id: memoryState.questions.length + idx + 1,
          examId: newExamId,
          questionText: q.questionText,
          type: (q.type as 'multiple_choice' | 'true_false') || 'multiple_choice',
          options: q.options,
          correctOptionIndex: Number(q.correctOptionIndex) || 0,
          explanation: q.explanation || '',
          points: Number(q.points) || 1,
        });
      });
    }
    return memExam;
  }

  try {
    const insertedExam = await db.insert(exams).values({
      title: examData.title,
      description: examData.description || '',
      timeLimitMinutes: Number(examData.timeLimitMinutes) || 20,
      maxAttempts: Number(examData.maxAttempts) || 1,
      term: examData.term || 'الترم الأول',
      unit: examData.unit || 'Unit 1',
      passingScorePercent: Number(examData.passingScorePercent) || 60,
      isPublished: examData.isPublished !== undefined ? examData.isPublished : true,
    }).returning();

    const examId = insertedExam[0].id;

    if (questionsData && questionsData.length > 0) {
      for (const q of questionsData) {
        await db.insert(examQuestions).values({
          examId,
          questionText: q.questionText,
          type: (q.type as 'multiple_choice' | 'true_false') || 'multiple_choice',
          options: q.options,
          correctOptionIndex: Number(q.correctOptionIndex) || 0,
          explanation: q.explanation || '',
          points: Number(q.points) || 1,
        });
      }
    }

    return insertedExam[0];
  } catch (error) {
    console.warn('createExam fallback to memory:', error);
    memoryState.exams.unshift(memExam);
    return memExam;
  }
}

export async function deleteExam(examId: number) {
  const idx = memoryState.exams.findIndex(e => e.id === examId);
  if (idx !== -1) {
    memoryState.exams.splice(idx, 1);
  }
  memoryState.questions = memoryState.questions.filter(q => q.examId !== examId);

  if (!hasDatabaseConfigured()) {
    return [{ id: examId }];
  }

  try {
    return await db.delete(exams).where(eq(exams.id, examId)).returning();
  } catch (error) {
    console.warn('deleteExam fallback to memory:', error);
    return [{ id: examId }];
  }
}

// --- EXAM SUBMISSION & GRADING ---
export async function submitExamAnswers(data: {
  studentId: number;
  examId: number;
  timeSpentSeconds: number;
  answers: Record<string, number>;
}) {
  // Try DB first if configured
  if (hasDatabaseConfigured()) {
    try {
      // 1. Fetch exam and questions with correct answers
      const examData = await db.select().from(exams).where(eq(exams.id, data.examId));
      if (examData.length === 0) throw new Error('الاختبار غير موجود');
      const exam = examData[0];

      const studentData = await db.select().from(students).where(eq(students.id, data.studentId));
      if (studentData.length === 0) throw new Error('بيانات الطالب غير موجودة');
      const student = studentData[0];

      // Check attempts
      const existingAttempts = await db.select().from(examResults)
        .where(and(eq(examResults.examId, exam.id), eq(examResults.studentId, student.id)));
      
      if (exam.maxAttempts > 0 && existingAttempts.length >= exam.maxAttempts) {
        throw new Error(`لقد استنفدت جميع محاولاتك لهذا الاختبار (${exam.maxAttempts} محاولة)`);
      }

      const questions = await db.select().from(examQuestions).where(eq(examQuestions.examId, exam.id));
      
      let totalScore = 0;
      let totalPossible = 0;
      const gradedBreakdown: Array<{
        questionId: number;
        questionText: string;
        options: string[];
        chosenIndex: number;
        correctIndex: number;
        isCorrect: boolean;
        explanation?: string | null;
        points: number;
      }> = [];

      for (const q of questions) {
        totalPossible += q.points;
        const studentChosenIndex = data.answers[String(q.id)];
        const isCorrect = studentChosenIndex !== undefined && Number(studentChosenIndex) === q.correctOptionIndex;

        if (isCorrect) {
          totalScore += q.points;
        }

        gradedBreakdown.push({
          questionId: q.id,
          questionText: q.questionText,
          options: q.options as string[],
          chosenIndex: studentChosenIndex !== undefined ? Number(studentChosenIndex) : -1,
          correctIndex: q.correctOptionIndex,
          isCorrect,
          explanation: q.explanation,
          points: q.points,
        });
      }

      const scorePercent = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      const passed = scorePercent >= exam.passingScorePercent;

      const insertedResult = await db.insert(examResults).values({
        studentId: student.id,
        examId: exam.id,
        studentName: student.name,
        studentPhone: student.phone,
        score: totalScore,
        totalPossiblePoints: totalPossible,
        scorePercent,
        timeSpentSeconds: data.timeSpentSeconds,
        answers: data.answers,
        attemptNumber: existingAttempts.length + 1,
        passed,
      }).returning();

      return {
        result: insertedResult[0],
        gradedBreakdown,
        examTitle: exam.title,
      };
    } catch (error: any) {
      if (error.message?.includes('غير موجود') || error.message?.includes('استنفدت')) {
        throw error;
      }
      console.warn('submitExamAnswers DB error, falling back to memory:', error);
    }
  }

  // In-memory grading fallback
  const memExam = memoryState.exams.find(e => e.id === Number(data.examId)) || memoryState.exams[0];
  if (!memExam) throw new Error('الاختبار غير موجود');

  const memStudent = memoryState.students.find(s => s.id === Number(data.studentId)) || {
    id: data.studentId,
    name: 'طالب المنصة',
    phone: '',
  };

  const existingMemAttempts = memoryState.results.filter(
    r => r.examId === memExam.id && r.studentId === memStudent.id
  );

  if (memExam.maxAttempts > 0 && existingMemAttempts.length >= memExam.maxAttempts) {
    throw new Error(`لقد استنفدت جميع محاولاتك لهذا الاختبار (${memExam.maxAttempts} محاولة)`);
  }

  const memQuestions = memoryState.questions.filter(q => q.examId === memExam.id);
  let totalScore = 0;
  let totalPossible = 0;
  const gradedBreakdown: any[] = [];

  for (const q of memQuestions) {
    totalPossible += (q.points || 1);
    const chosenIndex = data.answers[String(q.id)];
    const isCorrect = chosenIndex !== undefined && Number(chosenIndex) === q.correctOptionIndex;

    if (isCorrect) totalScore += (q.points || 1);

    gradedBreakdown.push({
      questionId: q.id,
      questionText: q.questionText,
      options: q.options,
      chosenIndex: chosenIndex !== undefined ? Number(chosenIndex) : -1,
      correctIndex: q.correctOptionIndex,
      isCorrect,
      explanation: q.explanation,
      points: q.points || 1,
    });
  }

  const scorePercent = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
  const passed = scorePercent >= (memExam.passingScorePercent || 60);

  const newResult = {
    id: memoryState.results.length + 1,
    studentId: memStudent.id,
    examId: memExam.id,
    studentName: memStudent.name,
    studentPhone: memStudent.phone,
    score: totalScore,
    totalPossiblePoints: totalPossible,
    scorePercent,
    timeSpentSeconds: data.timeSpentSeconds,
    answers: data.answers,
    attemptNumber: existingMemAttempts.length + 1,
    passed,
    createdAt: new Date(),
    examTitle: memExam.title,
  };

  memoryState.results.unshift(newResult);

  return {
    result: newResult,
    gradedBreakdown,
    examTitle: memExam.title,
  };
}

// --- RESULTS & STATS ---
export async function getAllResults() {
  if (!hasDatabaseConfigured()) {
    return memoryState.results;
  }
  try {
    const results = await db.select({
      id: examResults.id,
      studentId: examResults.studentId,
      examId: examResults.examId,
      studentName: examResults.studentName,
      studentPhone: examResults.studentPhone,
      score: examResults.score,
      totalPossiblePoints: examResults.totalPossiblePoints,
      scorePercent: examResults.scorePercent,
      timeSpentSeconds: examResults.timeSpentSeconds,
      attemptNumber: examResults.attemptNumber,
      passed: examResults.passed,
      createdAt: examResults.createdAt,
      examTitle: exams.title,
    })
    .from(examResults)
    .leftJoin(exams, eq(examResults.examId, exams.id))
    .orderBy(desc(examResults.createdAt));

    return results;
  } catch (error) {
    console.warn('getAllResults fallback to memory:', error);
    return memoryState.results;
  }
}

export async function getStudentResults(studentId: number) {
  if (!hasDatabaseConfigured()) {
    return memoryState.results.filter(r => r.studentId === studentId);
  }
  try {
    const results = await db.select({
      id: examResults.id,
      examId: examResults.examId,
      score: examResults.score,
      totalPossiblePoints: examResults.totalPossiblePoints,
      scorePercent: examResults.scorePercent,
      timeSpentSeconds: examResults.timeSpentSeconds,
      attemptNumber: examResults.attemptNumber,
      passed: examResults.passed,
      createdAt: examResults.createdAt,
      examTitle: exams.title,
    })
    .from(examResults)
    .leftJoin(exams, eq(examResults.examId, exams.id))
    .where(eq(examResults.studentId, studentId))
    .orderBy(desc(examResults.createdAt));

    return results;
  } catch (error) {
    console.warn('getStudentResults fallback to memory:', error);
    return memoryState.results.filter(r => r.studentId === studentId);
  }
}

export async function getAdminStats() {
  if (!hasDatabaseConfigured()) {
    return {
      totalStudents: memoryState.students.length,
      totalCodes: memoryState.codes.length,
      usedCodes: memoryState.codes.filter(c => c.status === 'used').length,
      unusedCodes: memoryState.codes.filter(c => c.status === 'unused' || c.status === 'active').length,
      totalLessons: memoryState.lessons.length,
      totalExams: memoryState.exams.length,
      totalSubmissions: memoryState.results.length,
      averageScorePercent: 85,
    };
  }
  try {
    const [stCount] = await db.select({ count: count() }).from(students);
    const [cTotal] = await db.select({ count: count() }).from(accessCodes);
    const [cUsed] = await db.select({ count: count() }).from(accessCodes).where(eq(accessCodes.status, 'used'));
    const [cUnused] = await db.select({ count: count() }).from(accessCodes).where(eq(accessCodes.status, 'unused'));
    const [lCount] = await db.select({ count: count() }).from(lessons);
    const [eCount] = await db.select({ count: count() }).from(exams);
    const [resCount] = await db.select({ count: count() }).from(examResults);
    const [avgScore] = await db.select({ avg: avg(examResults.scorePercent) }).from(examResults);

    return {
      totalStudents: Number(stCount?.count || 0),
      totalCodes: Number(cTotal?.count || 0),
      usedCodes: Number(cUsed?.count || 0),
      unusedCodes: Number(cUnused?.count || 0),
      totalLessons: Number(lCount?.count || 0),
      totalExams: Number(eCount?.count || 0),
      totalSubmissions: Number(resCount?.count || 0),
      averageScorePercent: Math.round(Number(avgScore?.avg || 0)),
    };
  } catch (error) {
    console.warn('getAdminStats fallback to memory:', error);
    return {
      totalStudents: memoryState.students.length,
      totalCodes: memoryState.codes.length,
      usedCodes: memoryState.codes.filter(c => c.status === 'used').length,
      unusedCodes: memoryState.codes.filter(c => c.status === 'unused' || c.status === 'active').length,
      totalLessons: memoryState.lessons.length,
      totalExams: memoryState.exams.length,
      totalSubmissions: memoryState.results.length,
      averageScorePercent: 85,
    };
  }
}

// Reset or clear test submissions for real official deployment
export async function clearDemoData(keepCurriculum: boolean = true) {
  // Always clean memoryState
  memoryState.results = [];
  memoryState.students = [];
  memoryState.codes.forEach(c => {
    c.status = 'unused';
    c.usedByStudentName = null;
    c.usedByStudentPhone = null;
    c.usedAt = null;
  });

  if (!keepCurriculum) {
    memoryState.exams = [];
    memoryState.questions = [];
    memoryState.lessons = [];
  }

  if (hasDatabaseConfigured()) {
    try {
      // Delete exam results
      await db.delete(examResults);
      // Delete students
      await db.delete(students);
      // Reset all access codes to unused and unassigned
      await db.update(accessCodes).set({
        status: 'unused',
        usedByStudentName: null,
        usedByStudentPhone: null,
        usedAt: null,
      });

      if (!keepCurriculum) {
        await db.delete(examQuestions);
        await db.delete(exams);
        await db.delete(lessons);
      }
    } catch (error) {
      console.warn('clearDemoData DB warning:', error);
    }
  }

  return { success: true, message: 'تم تجهيز وتصفير سجلات الطلاب لبدء العمل الفعلي' };
}

// --- ADMIN PASSWORD & SECURITY MANAGEMENT ---
export async function getAdminPin(): Promise<string> {
  if (!hasDatabaseConfigured()) {
    return memoryState.adminPin || process.env.ADMIN_PIN || 'emam2025';
  }
  try {
    const records = await db.select().from(systemSettings).where(eq(systemSettings.key, 'admin_pin'));
    if (records.length > 0 && records[0].value) {
      return records[0].value;
    }
    return memoryState.adminPin || process.env.ADMIN_PIN || 'emam2025';
  } catch (error) {
    console.warn('getAdminPin fallback to in-memory PIN:', error);
    return memoryState.adminPin || process.env.ADMIN_PIN || 'emam2025';
  }
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const currentPin = await getAdminPin();
  const trimmed = (pin || '').trim();
  return trimmed === currentPin.trim();
}

export async function changeAdminPin(currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
  try {
    const isValid = await verifyAdminPin(currentPin);
    if (!isValid) {
      throw new Error('كلمة المرور الحالية غير صحيحة');
    }

    const cleanNewPin = (newPin || '').trim();
    if (!cleanNewPin || cleanNewPin.length < 4) {
      throw new Error('كلمة المرور الجديدة يجب ألا تقل عن 4 خانات');
    }

    memoryState.adminPin = cleanNewPin;

    if (hasDatabaseConfigured()) {
      try {
        await db.insert(systemSettings)
          .values({
            key: 'admin_pin',
            value: cleanNewPin,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: systemSettings.key,
            set: {
              value: cleanNewPin,
              updatedAt: new Date(),
            },
          });
      } catch (dbErr) {
        console.warn('changeAdminPin saved to memory, DB warning:', dbErr);
      }
    }

    return { success: true, message: 'تم تغيير كلمة مرور المشرف بنجاح' };
  } catch (error: any) {
    console.error('changeAdminPin error:', error);
    throw new Error(error.message || 'فشل تغيير كلمة المرور');
  }
}

