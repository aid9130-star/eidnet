import React, { useState } from 'react';
import { KeyRound, User, Phone, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Student } from '../types.ts';
import * as dataService from '../lib/dataService.ts';

interface StudentLoginProps {
  onSuccess: (student: Student) => void;
  onGoToTeacher: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ onSuccess, onGoToTeacher }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanCode = code.trim();

    if (!cleanName || !cleanPhone || !cleanCode) {
      setError('يرجى ملء جميع الحقول المطلوبة (الاسم، الهاتف، وكود التفعيل)');
      return;
    }

    setLoading(true);
    try {
      const student = await dataService.studentLogin(cleanName, cleanPhone, cleanCode);
      onSuccess(student);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول، تأكد من صحة كود التفعيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-100 dark:shadow-slate-950/50 border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 dark:from-indigo-800 dark:via-indigo-900 dark:to-slate-900 p-8 text-white text-center relative">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xs rounded-2xl mx-auto flex items-center justify-center mb-4 border border-white/20 shadow-inner">
              <KeyRound className="w-8 h-8 text-indigo-100" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">تسجيل دخول الطلاب</h1>
            <p className="text-indigo-100 text-sm mt-1">منصة التفوق في اللغة الإنجليزية — أ. إمام يوسف</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm p-4 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                الاسم بالكامل <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمد علي"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                رقم الهاتف (واتساب) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  placeholder="مثال: 01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                كود التفعيل الخاص بك <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="مثال: TOP-2025-A1"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full pr-11 pl-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-mono tracking-wider transition-all text-sm"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                يتم الحصول على كود التفعيل المعتمد مباشرة من الأستاذ إمام يوسف.
              </p>
            </div>

            {/* Official Security Notice */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-950 dark:text-emerald-200 block mb-0.5">نظام تسجيل رسمي ومؤمّن</span>
                كود التفعيل مخصص لطالب واحد فقط ويتم ربطه بحسابك وسجل درجاتك طوال العام الدراسي.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>تفعيل الحساب والدخول للمنصة</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>

            {/* WhatsApp Request Assistance */}
            <div className="text-center pt-1">
              <a
                href="https://wa.me/201000000000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D9%85%D8%B3%D8%AA%D8%B1%20%D8%A5%D9%85%D8%A7%D9%85%20%D9%8A%D9%88%D8%B3%D9%81%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%AD%D8%B5%D9%88%D9%84%20%D8%B9%D9%84%D9%89%20%D9%83%D9%88%D8%AF%20%D8%AA%D9%81%D8%B9%D9%8A%D9%84%20%D9%85%D9%86%D8%B5%D8%A9%20%D8%A7%D9%84%D8%AA%D9%81%D9%88%D9%82"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
              >
                <span>لا تمتلك كود تفعيل بعد؟ تواصل مع إدارة المنصة</span>
              </a>
            </div>
          </form>

          {/* Footer Teacher Link */}
          <div className="bg-slate-50 dark:bg-slate-850 px-8 py-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={onGoToTeacher}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
            >
              هل أنت المدرس أو المشرف؟ <span className="underline font-bold">الدخول للوحة التحكم</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
