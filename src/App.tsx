import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { StudentLogin } from './components/StudentLogin.tsx';
import { LessonsView } from './components/LessonsView.tsx';
import { ExamsListView } from './components/ExamsListView.tsx';
import { ExamTaking } from './components/ExamTaking.tsx';
import { StudentResultsView } from './components/StudentResultsView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { Student, Lesson, Exam } from './types.ts';
import * as dataService from './lib/dataService.ts';
import * as clientStore from './lib/clientStore.ts';

export default function App() {
  const [currentRole, setCurrentRole] = useState<'student' | 'admin' | 'none'>('none');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<string>('lessons');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  // Dark Mode Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('tafawwoq_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('tafawwoq_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Lessons and exams state
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);

  // Active exam state
  const [activeExamId, setActiveExamId] = useState<number | null>(null);

  // Check saved student session or teacher session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('tafawwoq_student_token');
    if (savedToken) {
      const localStudents = clientStore.getStudentsLocal();
      const matched = localStudents.find((s) => s.sessionToken === savedToken);
      if (matched) {
        setCurrentStudent(matched);
        setCurrentRole('student');
      } else {
        fetch('/api/student/me', {
          headers: { 'x-student-token': savedToken },
        })
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error('Invalid session');
          })
          .then((data) => {
            if (data.student) {
              setCurrentStudent(data.student);
              setCurrentRole('student');
            }
          })
          .catch(() => {
            localStorage.removeItem('tafawwoq_student_token');
          });
      }
    } else {
      const adminAuth = sessionStorage.getItem('tafawwoq_admin_auth');
      if (adminAuth) {
        setCurrentRole('admin');
      }
    }
  }, []);

  // Fetch content when student logs in
  useEffect(() => {
    if (currentRole === 'student' && currentStudent) {
      loadStudentContent();
    }
  }, [currentRole, currentStudent]);

  const loadStudentContent = async () => {
    try {
      setLoadingContent(true);
      const studentId = currentStudent ? currentStudent.id : undefined;
      const [lessonsRes, examsRes] = await Promise.all([
        dataService.getLessons(false),
        dataService.getExams(studentId),
      ]);
      setLessons(lessonsRes || []);
      setExams(examsRes || []);
    } catch (err) {
      console.error('Failed to load student content:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleStudentLoginSuccess = (student: Student) => {
    localStorage.setItem('tafawwoq_student_token', student.sessionToken);
    setCurrentStudent(student);
    setCurrentRole('student');
    setActiveTab('lessons');
  };

  const handleLogout = () => {
    localStorage.removeItem('tafawwoq_student_token');
    sessionStorage.removeItem('tafawwoq_admin_auth');
    setCurrentStudent(null);
    setCurrentRole('none');
    setActiveExamId(null);
  };

  const handleOpenAdminLogin = () => {
    // If already authenticated in session, switch directly
    if (sessionStorage.getItem('tafawwoq_admin_auth')) {
      setCurrentRole('admin');
    } else {
      setShowAdminLoginModal(true);
    }
  };

  const handleStartExam = (examId: number) => {
    setActiveExamId(examId);
  };

  const handleFinishExam = () => {
    setActiveExamId(null);
    loadStudentContent();
    setActiveTab('my-results');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Cairo',sans-serif] transition-colors duration-200">
      <Navbar
        currentRole={currentRole}
        currentStudent={currentStudent}
        onLogout={handleLogout}
        onSwitchToAdmin={handleOpenAdminLogin}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveExamId(null);
          setActiveTab(tab);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* NONE / LOGGED OUT: Show Student Code Login Form */}
        {currentRole === 'none' && (
          <StudentLogin
            onSuccess={handleStudentLoginSuccess}
            onGoToTeacher={handleOpenAdminLogin}
          />
        )}

        {/* TEACHER / ADMIN DASHBOARD */}
        {currentRole === 'admin' && <AdminDashboard />}

        {/* STUDENT DASHBOARD */}
        {currentRole === 'student' && currentStudent && (
          <div>
            {/* Taking an exam */}
            {activeExamId !== null ? (
              <ExamTaking
                examId={activeExamId}
                student={currentStudent}
                onFinish={handleFinishExam}
              />
            ) : (
              <>
                {activeTab === 'lessons' && (
                  <LessonsView lessons={lessons} loading={loadingContent} />
                )}
                {activeTab === 'exams' && (
                  <ExamsListView
                    exams={exams}
                    loading={loadingContent}
                    onStartExam={handleStartExam}
                  />
                )}
                {activeTab === 'my-results' && (
                  <StudentResultsView student={currentStudent} />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            منصة التفوق التعليمية — مادة اللغة الإنجليزية | إشراف الأستاذ إمام يوسف
          </p>
          <p className="text-slate-400 dark:text-slate-500 mt-1">
            جميع الحقوق محفوظة © {new Date().getFullYear()} — مدعومة بقاعدة بيانات سحابية متطورة (Cloud SQL / PostgreSQL)
          </p>
        </div>
      </footer>

      {/* Teacher Authentication Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={() => {
          setCurrentRole('admin');
        }}
      />
    </div>
  );
}
