import React from 'react';
import { LogOut, User, Sparkles, BookOpen, FileCheck, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Student } from '../types.ts';

interface NavbarProps {
  currentRole: 'student' | 'admin' | 'none';
  currentStudent: Student | null;
  onLogout: () => void;
  onSwitchToAdmin: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentStudent,
  onLogout,
  onSwitchToAdmin,
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100 dark:shadow-none">
              <span className="text-xl">ت</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">منصة التفوق</span>
                <span className="bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/60">
                  لغة إنجليزية
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">إشراف الأستاذ إمام يوسف</p>
            </div>
          </div>

          {/* Nav Tabs for Student */}
          {currentRole === 'student' && (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setActiveTab('lessons')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'lessons'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                الدروس المسجلة
              </button>
              <button
                onClick={() => setActiveTab('exams')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'exams'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                الاختبارات والتقييمات
              </button>
              <button
                onClick={() => setActiveTab('my-results')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'my-results'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                سجل درجاتي
              </button>
            </div>
          )}

          {/* User Profile / Admin Switch / Dark Mode Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggle Button */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={onToggleTheme}
              className="flex items-center gap-2 px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-amber-300 hover:border-indigo-200 dark:hover:border-slate-600 transition-all cursor-pointer shadow-2xs group"
              title={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي لتقليل إجهاد العين أثناء المذاكرة'}
              aria-label={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
                  <span className="hidden sm:inline text-xs font-bold text-slate-200">نهاري</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 transition-transform group-hover:-rotate-12" />
                  <span className="hidden sm:inline text-xs font-bold text-slate-700">ليلي</span>
                </>
              )}
            </button>

            {currentRole === 'student' && currentStudent && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{currentStudent.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 dir-ltr">{currentStudent.phone}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="تسجيل الخروج"
                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}

            {currentRole === 'admin' && (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  لوحة تحكم المدرس
                </span>
                <button
                  onClick={onLogout}
                  className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  الخروج للرئيسية
                </button>
              </div>
            )}

            {currentRole === 'none' && (
              <button
                onClick={onSwitchToAdmin}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                دخول المدرس
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

