import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Users,
  Video,
  FileCheck,
  BarChart3,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  Sparkles,
  Phone,
  BookOpen,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { AccessCode, Lesson, Exam, AdminStats } from '../types.ts';
import { ChangeAdminPinModal } from './ChangeAdminPinModal.tsx';
import * as dataService from '../lib/dataService.ts';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'codes' | 'lessons' | 'exams' | 'students' | 'results'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Codes state
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [generateCount, setGenerateCount] = useState<number>(10);
  const [generateNote, setGenerateNote] = useState<string>('مجموعة السبت - الصف الثالث الثانوي');
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Lessons state
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    videoUrl: '',
    durationMinutes: 40,
    term: 'الترم الأول',
    unit: 'Unit 1: Cultural Identity',
    lessonNumber: 1,
  });

  // Exams state
  const [exams, setExams] = useState<Exam[]>([]);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    timeLimitMinutes: 20,
    maxAttempts: 2,
    term: 'الترم الأول',
    unit: 'Unit 1',
    passingScorePercent: 60,
  });
  const [examQuestionsList, setExamQuestionsList] = useState<Array<{
    questionText: string;
    type: 'multiple_choice' | 'true_false';
    options: string[];
    correctOptionIndex: number;
    explanation: string;
    points: number;
  }>>([
    {
      questionText: 'By the time my father arrived, we _______ our dinner.',
      type: 'multiple_choice',
      options: ['had finished', 'have finished', 'were finishing', 'finish'],
      correctOptionIndex: 0,
      explanation: 'نستخدم الماضي التام (had + p.p) للحدث الأقدم الذي تم قبل حدث آخر في الماضي (arrived).',
      points: 2,
    },
  ]);

  // Students & Results
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [resetPin, setResetPin] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const handleResetProductionData = async () => {
    if (!resetPin) return;
    setResetting(true);
    setResetMsg(null);
    try {
      await dataService.resetData(resetPin);
      setResetMsg('تم تصفير سجلات الطلاب التجريبية وإعادة الأكواد غير مستخدمة بنجاح!');
      setTimeout(() => {
        setShowResetModal(false);
        setResetMsg(null);
        setResetPin('');
        fetchAllAdminData();
      }, 1500);
    } catch (err: any) {
      setResetMsg(err.message || 'حدث خطأ');
    } finally {
      setResetting(false);
    }
  };

  const fetchAllAdminData = async () => {
    try {
      const [statsRes, codesRes, lessonsRes, examsRes, studentsRes, resultsRes] = await Promise.all([
        dataService.getStats(),
        dataService.getCodes(),
        dataService.getLessons(true),
        dataService.getExams(),
        dataService.getStudents(),
        dataService.getResults(),
      ]);

      setStats(statsRes);
      setCodes(codesRes);
      setLessons(lessonsRes);
      setExams(examsRes);
      setStudents(studentsRes);
      setResults(resultsRes);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  // --- ACCESS CODES ACTIONS ---
  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await dataService.generateCodes(generateCount, generateNote);
      await fetchAllAdminData();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleCode = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'disabled' ? 'unused' : 'disabled';
    try {
      await dataService.updateCode(id, nextStatus as any);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCode = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الكود؟')) return;
    try {
      await dataService.deleteCode(id);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCode(codeStr);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // --- LESSON ACTIONS ---
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.saveLesson(newLesson);
      setShowAddLessonModal(false);
      setNewLesson({
        title: '',
        description: '',
        videoUrl: '',
        durationMinutes: 40,
        term: 'الترم الأول',
        unit: 'Unit 1',
        lessonNumber: lessons.length + 1,
      });
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدرس نهائياً؟')) return;
    try {
      await dataService.deleteLesson(id);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // --- EXAM ACTIONS ---
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.createExam(newExam, examQuestionsList);
      setShowAddExamModal(false);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الاختبار؟')) return;
    try {
      await dataService.deleteExam(id);
      fetchAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuestionToExam = () => {
    setExamQuestionsList((prev) => [
      ...prev,
      {
        questionText: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: '',
        points: 2,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Admin Top Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>لوحة تحكم الأستاذ إمام يوسف</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>النسخة الأساسية المعتمدة (Live Production)</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            إدارة منصة التفوق للغة الإنجليزية
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            إدارة الأكواد، رفع المحاضرات، ضبط الاختبارات ومتابعة درجات الطلاب في مكان واحد.
          </p>
        </div>

        {/* Action quick shortcut */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowChangePinModal(true)}
            title="تغيير كلمة مرور المشرف للوحة التحكم"
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-900/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>تغيير كلمة المرور</span>
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            title="تصفير بيانات الطلاب والتسليمات التجريبية وبدء عام دراسي نظيف"
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 border border-rose-900/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تهيئة المنصة للعام الجديد</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('codes');
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>توليد أكواد جديدة</span>
          </button>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1 overflow-x-auto transition-colors">
        {[
          { id: 'stats', label: 'الإحصائيات العامة', icon: BarChart3 },
          { id: 'codes', label: 'أكواد التفعيل', icon: KeyRound },
          { id: 'lessons', label: 'الدروس والمحاضرات', icon: Video },
          { id: 'exams', label: 'الاختبارات والأسئلة', icon: FileCheck },
          { id: 'students', label: 'الطلاب المسجلين', icon: Users },
          { id: 'results', label: 'نتائج الاختبارات', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STATS */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
                <span className="text-xs font-semibold">إجمالي الطلاب المسجلين</span>
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.totalStudents}</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">حسابات نشطة ومفعلة</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
                <span className="text-xs font-semibold">أكواد التفعيل المتبقية</span>
                <KeyRound className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.unusedCodes}</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                من إجمالي {stats.totalCodes} كود تم توليده
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
                <span className="text-xs font-semibold">المحاضرات والدروس</span>
                <Video className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.totalLessons}</div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">متاحة للطلاب</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
                <span className="text-xs font-semibold">متوسط درجات الطلاب</span>
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.averageScorePercent}%</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                من {stats.totalSubmissions} تسليم اختبار
              </div>
            </div>
          </div>

          {/* Quick Summary Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4">آخر الطلاب المنضمين للمنصة</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.slice(0, 5).map((st) => (
                  <div key={st.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{st.name}</div>
                      <div className="text-slate-400 dark:text-slate-500 font-mono" dir="ltr">{st.phone}</div>
                    </div>
                    <div className="text-left font-mono bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded font-bold border border-indigo-100 dark:border-indigo-900/50">
                      {st.codeUsed}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4">آخر نتائج الاختبارات المسلمة</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.slice(0, 5).map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{r.studentName}</div>
                      <div className="text-slate-400 dark:text-slate-500">{r.examTitle}</div>
                    </div>
                    <div className="text-left font-bold text-sm">
                      <span className={r.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {r.scorePercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security & Access Management Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>أمان وحماية لوحة المشرف</span>
              </div>
              <h4 className="text-base font-bold text-white">كلمة مرور الأستاذ إمام يوسف (Admin PIN)</h4>
              <p className="text-slate-300 text-xs leading-relaxed max-w-xl">
                لوحة التحكم محمية بكلمة مرور خاصة في قاعدة البيانات. يمكنك تغيير كلمة المرور في أي وقت بحرية واختيار كلمة مرور جديدة سريّة تناسبك.
              </p>
            </div>
            <button
              onClick={() => setShowChangePinModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>تغيير كلمة المرور الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: ACCESS CODES MANAGEMENT */}
      {activeTab === 'codes' && (
        <div className="space-y-6">
          {/* Generation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">توليد أكواد دخول جديدة للطلاب</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              يستخدم كل طالب كوداً واحداً فقط لتفعيل حسابه وربطه باسمه ورقم هاتفه.
            </p>

            <form onSubmit={handleGenerateCodes} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-40">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">عدد الأكواد</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="w-full flex-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ملاحظة / المجموعة التابع لها الكود
                </label>
                <input
                  type="text"
                  placeholder="مثال: طلاب سنتر التفوق - مجموعة الإثنين"
                  value={generateNote}
                  onChange={(e) => setGenerateNote(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{generating ? 'جاري التوليد...' : `توليد (${generateCount}) كود`}</span>
              </button>
            </form>
          </div>

          {/* Codes Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">سجل الأكواد المُنشأة ({codes.length})</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">الكود</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">الملاحظة / المجموعة</th>
                    <th className="p-4">المستخدم المفعل به</th>
                    <th className="p-4">تاريخ التفعيل</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {codes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs tracking-wider border border-transparent dark:border-slate-700">
                            {item.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(item.code)}
                            title="نسخ الكود"
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {copiedCode === item.code && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">تم النسخ!</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        {item.status === 'unused' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            جاهز للاستخدام
                          </span>
                        )}
                        {item.status === 'used' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            مُستخدَم
                          </span>
                        )}
                        {item.status === 'disabled' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            معطّل
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-400">{item.note || '—'}</td>

                      <td className="p-4">
                        {item.usedByStudentName ? (
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.usedByStudentName}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono" dir="ltr">
                              {item.usedByStudentPhone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        {item.usedAt ? new Date(item.usedAt).toLocaleDateString('ar-EG') : 'لم يفعل بعد'}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleCode(item.id, item.status)}
                            className="px-2 py-1 text-[11px] rounded font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            {item.status === 'disabled' ? 'تفعيل' : 'تعطيل'}
                          </button>
                          <button
                            onClick={() => handleDeleteCode(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LESSONS MANAGEMENT */}
      {activeTab === 'lessons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">قائمة المحاضرات المرفوعة ({lessons.length})</h3>
            <button
              onClick={() => setShowAddLessonModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة درس فيديو جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((l) => (
              <div key={l.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-2">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/50 px-2 py-0.5 rounded">{l.unit}</span>
                    <span>{l.term}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-2">{l.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{l.description}</p>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-4">
                    <Clock className="w-3.5 h-3.5" />
                    <span>المدة: {l.durationMinutes} دقيقة</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <a
                    href={l.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    رابط الفيديو
                  </a>
                  <button
                    onClick={() => handleDeleteLesson(l.id)}
                    className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal for adding lesson */}
          {showAddLessonModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">إضافة درس فيديو جديد</h3>
                  <button
                    onClick={() => setShowAddLessonModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان الدرس</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: Unit 1: Past Simple vs Past Continuous"
                      value={newLesson.title}
                      onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رابط الفيديو (يوتيوب أو رابط مباشر)</label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newLesson.videoUrl}
                      onChange={(e) => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الوحدة</label>
                      <input
                        type="text"
                        required
                        value={newLesson.unit}
                        onChange={(e) => setNewLesson({ ...newLesson, unit: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المدة (بالدقائق)</label>
                      <input
                        type="number"
                        min="1"
                        value={newLesson.durationMinutes}
                        onChange={(e) => setNewLesson({ ...newLesson, durationMinutes: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الوصف المختصر والمحتوى</label>
                    <textarea
                      rows={3}
                      value={newLesson.description}
                      onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddLessonModal(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer"
                    >
                      حفظ الدرس
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXAMS MANAGEMENT */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">إدارة الاختبارات والأسئلة ({exams.length})</h3>
            <button
              onClick={() => setShowAddExamModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء اختبار جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((ex) => (
              <div key={ex.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-2">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/50 px-2 py-0.5 rounded">{ex.unit}</span>
                    <span>{ex.timeLimitMinutes} دقيقة</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">{ex.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{ex.description}</p>
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <div>عدد الأسئلة: <span className="font-bold text-slate-800 dark:text-slate-200">{ex.questionsCount || 0}</span></div>
                    <div>أقصى عدد محاولات للطالب: <span className="font-bold text-slate-800 dark:text-slate-200">{ex.maxAttempts}</span></div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                  <button
                    onClick={() => handleDeleteExam(ex.id)}
                    className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف الاختبار
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal for adding exam */}
          {showAddExamModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 my-8">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">إنشاء اختبار جديد وتحديد الأسئلة</h3>
                  <button
                    onClick={() => setShowAddExamModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان الاختبار</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: اختبار جرامر شامل Unit 2"
                        value={newExam.title}
                        onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الوحدة</label>
                      <input
                        type="text"
                        required
                        value={newExam.unit}
                        onChange={(e) => setNewExam({ ...newExam, unit: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">وقت الاختبار (بالدقائق)</label>
                      <input
                        type="number"
                        min="1"
                        value={newExam.timeLimitMinutes}
                        onChange={(e) => setNewExam({ ...newExam, timeLimitMinutes: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عدد المحاولات المسموحة</label>
                      <input
                        type="number"
                        min="1"
                        value={newExam.maxAttempts}
                        onChange={(e) => setNewExam({ ...newExam, maxAttempts: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Questions Builder */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">الأسئلة ({examQuestionsList.length})</span>
                      <button
                        type="button"
                        onClick={handleAddQuestionToExam}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        إضافة سؤال آخر
                      </button>
                    </div>

                    {examQuestionsList.map((q, qIndex) => (
                      <div key={qIndex} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">سؤال #{qIndex + 1}</div>
                        <input
                          type="text"
                          required
                          placeholder="نص السؤال (بالإنجليزية)..."
                          value={q.questionText}
                          onChange={(e) => {
                            const updated = [...examQuestionsList];
                            updated[qIndex].questionText = e.target.value;
                            setExamQuestionsList(updated);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          dir="ltr"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={q.correctOptionIndex === optIndex}
                                onChange={() => {
                                  const updated = [...examQuestionsList];
                                  updated[qIndex].correctOptionIndex = optIndex;
                                  setExamQuestionsList(updated);
                                }}
                              />
                              <input
                                type="text"
                                required
                                placeholder={`الخيار ${String.fromCharCode(65 + optIndex)}`}
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...examQuestionsList];
                                  updated[qIndex].options[optIndex] = e.target.value;
                                  setExamQuestionsList(updated);
                                }}
                                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                dir="ltr"
                              />
                            </div>
                          ))}
                        </div>

                        <input
                          type="text"
                          placeholder="تفسير الإجابة الصحيحة للقاعدة (اختياري)..."
                          value={q.explanation}
                          onChange={(e) => {
                            const updated = [...examQuestionsList];
                            updated[qIndex].explanation = e.target.value;
                            setExamQuestionsList(updated);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddExamModal(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer"
                    >
                      إنشاء الاختبار والأسئلة
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: STUDENTS LIST */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">الطلاب المسجلين والمفعلين ({students.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">اسم الطالب</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4">الكود المستخدم</th>
                  <th className="p-4">تاريخ الانضمام</th>
                  <th className="p-4">آخر نشاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{st.name}</td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400" dir="ltr">{st.phone}</td>
                    <td className="p-4 font-mono font-bold text-indigo-700 dark:text-indigo-400">{st.codeUsed}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(st.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(st.lastActiveAt).toLocaleTimeString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: RESULTS LIST */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Chart Overview */}
          {results.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
                توزيع الدرجات ونسب النجاح لجميع تسليمات الطلاب
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                تحليل مرئي لدرجات الطلاب في مختلف الاختبارات باستخدام مكتبة Recharts.
              </p>

              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={results.slice(0, 15).map((r, i) => {
                      const stName = r.studentName || `طالب ${i + 1}`;
                      return {
                        name: stName.split(' ')[0] || `طالب ${i + 1}`,
                        fullName: stName,
                        examTitle: r.examTitle || 'اختبار',
                        score: r.scorePercent ?? 0,
                        passed: Boolean(r.passed),
                      };
                    })}
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-900 dark:bg-slate-800 text-white p-2.5 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1 font-['Cairo',sans-serif]" dir="rtl">
                              <div className="font-bold text-slate-100">{item.fullName}</div>
                              <div className="text-slate-400">{item.examTitle}</div>
                              <div className="text-amber-300 font-black">الدرجة: {item.score}%</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={36}>
                      {results.slice(0, 15).map((r, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={r.passed ? '#4f46e5' : '#f43f5e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">سجل نتائج وتسليمات الطلاب ({results.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">اسم الطالب</th>
                    <th className="p-4">الاختبار</th>
                    <th className="p-4">الدرجة</th>
                    <th className="p-4">النسبة</th>
                    <th className="p-4">الوقت المستغرق</th>
                    <th className="p-4">المحاولة</th>
                    <th className="p-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{r.studentName}</td>
                      <td className="p-4 text-slate-700 dark:text-slate-300">{r.examTitle}</td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{r.score} / {r.totalPossiblePoints}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold ${r.passed ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'}`}>
                          {r.scorePercent}%
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{Math.floor(r.timeSpentSeconds / 60)} د و {r.timeSpentSeconds % 60} ث</td>
                      <td className="p-4 font-bold text-slate-600 dark:text-slate-400">#{r.attemptNumber}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(r.createdAt).toLocaleDateString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RESET DATA MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 text-slate-800 dark:text-slate-200 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-center text-slate-900 dark:text-slate-100 mb-1">
              تهيئة وإعداد المنصة للعام الجديد
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4 leading-relaxed">
              هذا الإجراء مخصص للأستاذ إمام يوسف لبدء العمل الفعلي: سيتم حذف جميع حسابات وتسليمات الطلاب التجريبية، وإعادة جميع الأكواد لحالتها الأصلية غير المستخدمة، مع <strong>الحفاظ الكامل على جميع الدروس والاختبارات والأسئلة</strong> دون مساس.
            </p>

            {resetMsg && (
              <div className="mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-xs font-semibold text-center">
                {resetMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  أدخل رمز أمان المعلم للتأكيد (emam2025)
                </label>
                <input
                  type="password"
                  value={resetPin}
                  onChange={(e) => setResetPin(e.target.value)}
                  placeholder="رمز الأمان..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm font-mono text-center focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  dir="ltr"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={resetting || !resetPin}
                  onClick={handleResetProductionData}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {resetting ? 'جارِ التهيئة...' : 'تأكيد تصفير البيانات للإنتاج'}
                </button>
                <button
                  type="button"
                  disabled={resetting}
                  onClick={() => {
                    setShowResetModal(false);
                    setResetMsg(null);
                    setResetPin('');
                  }}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE ADMIN PIN MODAL */}
      <ChangeAdminPinModal
        isOpen={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
      />
    </div>
  );
};
