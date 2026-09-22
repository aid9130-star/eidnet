export interface AccessCode {
  id: number;
  code: string;
  status: 'unused' | 'used' | 'disabled';
  usedByStudentName?: string | null;
  usedByStudentPhone?: string | null;
  usedAt?: string | null;
  createdAt: string;
  note?: string | null;
}

export interface Student {
  id: number;
  name: string;
  phone: string;
  codeUsed: string;
  sessionToken: string;
  grade?: string | null;
  createdAt: string;
  lastActiveAt: string;
}

export interface Lesson {
  id: number;
  title: string;
  description?: string | null;
  videoUrl: string;
  durationMinutes: number;
  term: string;
  unit: string;
  lessonNumber: number;
  pdfAttachmentUrl?: string | null;
  isPublished: boolean;
  createdAt: string;
}

export interface ExamQuestion {
  id: number;
  examId: number;
  questionText: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctOptionIndex: number;
  explanation?: string | null;
  points: number;
}

export interface Exam {
  id: number;
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  maxAttempts: number;
  term: string;
  unit: string;
  passingScorePercent: number;
  isPublished: boolean;
  createdAt: string;
  questionsCount?: number;
  totalPoints?: number;
  userAttemptsCount?: number;
  bestScore?: number;
}

export interface ExamResult {
  id: number;
  studentId: number;
  examId: number;
  studentName: string;
  studentPhone: string;
  score: number;
  totalPossiblePoints: number;
  scorePercent: number;
  timeSpentSeconds: number;
  answers: Record<string, number>;
  attemptNumber: number;
  passed: boolean;
  createdAt: string;
  examTitle?: string;
}

export interface AdminStats {
  totalStudents: number;
  totalCodes: number;
  usedCodes: number;
  unusedCodes: number;
  totalLessons: number;
  totalExams: number;
  totalSubmissions: number;
  averageScorePercent: number;
}
