import React from 'react';
import { FileCheck, Clock, Award, AlertCircle, Play, CheckCircle2 } from 'lucide-react';
import { Exam } from '../types.ts';

interface ExamsListViewProps {
  exams: Exam[];
  loading: boolean;
  onStartExam: (examId: number) => void;
}

export const ExamsListView: React.FC<ExamsListViewProps> = ({ exams, loading, onStartExam }) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-800 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/10 mb-3">
            <FileCheck className="w-3.5 h-3.5" />
            نظام الاختبارات والتقييم الفوري
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">اختبارات إتقان اللغة الإنجليزية</h2>
          <p className="text-indigo-200 text-sm mt-2 leading-relaxed">
            اختبارات بمستوى امتحانات الثانوية العامة مع توقيت محدد، وتصحيح تلقائي فوري، وشرح تفصيلي لكل إجابة.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse space-y-4">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-1/3" />
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
            </div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors">
          <FileCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">لا توجد اختبارات متاحة حالياً</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">سيقوم الأستاذ إمام يوسف برفع اختبارات دورية قريباً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => {
            const hasExceededAttempts =
              exam.maxAttempts > 0 && (exam.userAttemptsCount || 0) >= exam.maxAttempts;

            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-1 rounded-md">
                      {exam.unit}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{exam.term}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {exam.description || 'اختبار شامل ومخصص لقياس استيعاب القواعد والمفردات مع التصحيح الفوري.'}
                  </p>

                  {/* Badges / Specs */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <div className="text-slate-400 dark:text-slate-400 mb-0.5 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>الوقت</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {exam.timeLimitMinutes > 0 ? `${exam.timeLimitMinutes} دقيقة` : 'مفتوح'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <div className="text-slate-400 dark:text-slate-400 mb-0.5 flex items-center justify-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>الأسئلة</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{exam.questionsCount || 0} سؤال</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <div className="text-slate-400 dark:text-slate-400 mb-0.5 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>المحاولات</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {exam.userAttemptsCount || 0}/{exam.maxAttempts}
                      </span>
                    </div>
                  </div>

                  {/* Previous Result badge if attempted */}
                  {(exam.userAttemptsCount || 0) > 0 && (
                    <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs px-3 py-2 rounded-xl flex items-center justify-between">
                      <span>أعلى درجة حققتها:</span>
                      <span className="font-bold text-sm">{exam.bestScore}%</span>
                    </div>
                  )}
                </div>

                {/* Start Button */}
                <div className="mt-6 pt-2">
                  {hasExceededAttempts ? (
                    <div className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 cursor-not-allowed">
                      <AlertCircle className="w-4 h-4" />
                      <span>تم استنفاد الحد الأقصى للمحاولات ({exam.maxAttempts})</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onStartExam(exam.id)}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 dark:shadow-none transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>
                        {(exam.userAttemptsCount || 0) > 0 ? 'إعادة الاختبار (محاولة جديدة)' : 'بدء الاختبار الآن'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
