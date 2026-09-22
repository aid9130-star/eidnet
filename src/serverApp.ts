import express from 'express';
import { seedInitialDataIfNeeded } from './db/seed.ts';
import {
  getAccessCodes,
  generateAccessCodes,
  toggleCodeStatus,
  deleteAccessCode,
  studentLoginOrRegister,
  getStudentByToken,
  getAllStudents,
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getExamsWithStats,
  getExamDetails,
  createExam,
  deleteExam,
  submitExamAnswers,
  getAllResults,
  getStudentResults,
  getAdminStats,
  clearDemoData,
  verifyAdminPin,
  changeAdminPin,
} from './db/queries.ts';

export function createApp() {
  const app = express();

  // Basic Middleware
  app.use(express.json());

  // CORS Middleware for flexible cross-origin and serverless calls
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-student-token');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Seed DB with demo English curriculum & codes asynchronously without delaying server start
  seedInitialDataIfNeeded().catch((err) => {
    console.warn('Initial DB seeding background warning:', err?.message || err);
  });

  // API Router: Contains all API routes
  const apiRouter = express.Router();

  // Health check
  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', app: 'El-Tafawwoq Platform', teacher: 'Emam Youssef' });
  });

  // 1. Student Code Login / Activation
  apiRouter.post('/student/login', async (req, res) => {
    try {
      const { name, phone, code } = req.body;
      if (!phone) {
        return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
      }
      if (!name) {
        return res.status(400).json({ error: 'الاسم الكامل مطلوب' });
      }
      if (!code) {
        return res.status(400).json({ error: 'كود التفعيل مطلوب للدخول إلى المنصة' });
      }

      const student = await studentLoginOrRegister(name, phone, code);
      res.json({ success: true, student });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل تسجيل الدخول' });
    }
  });

  // 2. Validate Student Session
  apiRouter.get('/student/me', async (req, res) => {
    try {
      const token = req.headers['x-student-token'] as string;
      if (!token) {
        return res.status(401).json({ error: 'غير مسجل' });
      }
      const student = await getStudentByToken(token);
      if (!student) {
        return res.status(401).json({ error: 'جلسة الطالب غير صالحة' });
      }
      res.json({ student });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Lessons (Student & Admin)
  apiRouter.get('/lessons', async (req, res) => {
    try {
      const isAdmin = req.query.isAdmin === 'true';
      const lessonsList = await getLessons(!isAdmin);
      res.json(lessonsList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/lessons', async (req, res) => {
    try {
      const lesson = await createLesson(req.body);
      res.json(lesson[0] || lesson);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.put('/lessons/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await updateLesson(id, req.body);
      res.json(updated[0] || updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.delete('/lessons/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteLesson(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Exams & Questions
  apiRouter.get('/exams', async (req, res) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;
      const examsList = await getExamsWithStats(studentId);
      res.json(examsList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.get('/exams/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const isTeacher = req.query.isTeacher === 'true';
      const exam = await getExamDetails(id, isTeacher);
      if (!exam) return res.status(404).json({ error: 'الاختبار غير موجود' });
      res.json(exam);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/exams', async (req, res) => {
    try {
      const { exam, questions } = req.body;
      const created = await createExam(exam, questions);
      res.json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.delete('/exams/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteExam(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Submit Exam
  apiRouter.post('/exams/:id/submit', async (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      const { studentId, timeSpentSeconds, answers } = req.body;
      const submission = await submitExamAnswers({
        studentId: Number(studentId),
        examId,
        timeSpentSeconds: Number(timeSpentSeconds) || 0,
        answers: answers || {},
      });
      res.json(submission);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل تسليم الاختبار' });
    }
  });

  // 6. Access Codes (Teacher / Admin)
  apiRouter.get('/admin/codes', async (req, res) => {
    try {
      const codes = await getAccessCodes();
      res.json(codes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/admin/codes/generate', async (req, res) => {
    try {
      const { amount, note } = req.body;
      const countToGen = Math.min(Math.max(Number(amount) || 1, 1), 100);
      const generated = await generateAccessCodes(countToGen, note);
      res.json(generated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.patch('/admin/codes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      const updated = await toggleCodeStatus(id, status);
      res.json(updated[0] || updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.delete('/admin/codes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteAccessCode(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. Students List (Admin)
  apiRouter.get('/admin/students', async (req, res) => {
    try {
      const studentsList = await getAllStudents();
      res.json(studentsList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 8. Exam Results (Admin & Student)
  apiRouter.get('/admin/results', async (req, res) => {
    try {
      const results = await getAllResults();
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.get('/student/:id/results', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const results = await getStudentResults(id);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 9. Admin Stats Overview
  apiRouter.get('/admin/stats', async (req, res) => {
    try {
      const stats = await getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 10. Teacher Authentication & PIN Management
  apiRouter.post('/admin/verify-pin', async (req, res) => {
    try {
      const { pin } = req.body;
      if (!pin) {
        return res.status(400).json({ error: 'رمز الدخول أو كلمة المرور مطلوبة' });
      }
      const isValid = await verifyAdminPin(pin);
      if (isValid) {
        return res.json({ success: true, token: 'tafawwoq_teacher_master_authenticated' });
      }
      return res.status(401).json({ error: 'كلمة المرور أو رمز الدخول غير صحيح' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post('/admin/change-pin', async (req, res) => {
    try {
      const { currentPin, newPin } = req.body;
      if (!currentPin) {
        return res.status(400).json({ error: 'كلمة المرور الحالية مطلوبة' });
      }
      if (!newPin || typeof newPin !== 'string' || newPin.trim().length < 4) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 4 خانات على الأقل' });
      }
      const result = await changeAdminPin(currentPin, newPin);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل تغيير كلمة المرور' });
    }
  });

  // 11. Clear test data for clean production launch
  apiRouter.post('/admin/reset-data', async (req, res) => {
    try {
      const { pin, keepCurriculum } = req.body;
      if (!pin) {
        return res.status(401).json({ error: 'رمز الأمان مطلوب' });
      }
      const isValid = await verifyAdminPin(pin);
      if (!isValid) {
        return res.status(401).json({ error: 'رمز الأمان غير مصرح به' });
      }
      const result = await clearDemoData(keepCurriculum !== false);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mount API router on BOTH '/api' and '/'
  // In standard Vite dev & Cloud Run: requests go to /api/... -> handled by '/api'
  // In Vercel serverless functions: rewrites to /api may strip or keep prefix -> handled by either!
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  return app;
}
