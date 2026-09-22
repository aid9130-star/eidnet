import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { Exam, Student } from '../types.ts';
import * as dataService from '../lib/dataService.ts';

interface ExamTakingProps {
  examId: number;
  student: Student;
  onFinish: () => void;
}

interface Question {
  id: number;
  questionText: string;
  type: string;
  options: string[];
  points: number;
}

interface ExamDetailedData extends Exam {
  questions: Question[];
}

export const ExamTaking: React.FC<ExamTakingProps> = ({ examId, student, onFinish }) => {
  const [exam, setExam] = useState<ExamDetailedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState<number>(Date.now());

  // Result state
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const data = await dataService.getExamDetails(examId);
      const detailedExam: ExamDetailedData = {
        ...data.exam,
        questions: data.questions as any,
      };
      setExam(detailedExam);

      if (detailedExam.timeLimitMinutes > 0) {
        setSecondsRemaining(detailedExam.timeLimitMinutes * 60);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع أثناء تحميل الاختبار');
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0 || submissionResult) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, submissionResult]);

  const handleAutoSubmit = () => {
    handleSubmit(true);
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: optionIndex,
    }));
  };

  const handleSubmit = async (forced = false) => {
    if (isSubmitting || submissionResult) return;

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = exam?.questions?.length || 0;

    if (!forced && answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `لقد أجبت على ${answeredCount} من أصل ${totalQuestions} أسئلة فقط. هل أنت متأكد من رغبتك في تسليم الاختبار الآن؟`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    try {
      const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);
      const data = await dataService.submitExam(
        examId,
        answers,
        student.id,
        student.name,
        timeSpentSeconds
      );

      setSubmissionResult(data as any);
    } catch (err: any) {
      alert(err.message || 'فشل تسليم الإجابات');
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-xl mx-auto my-8 transition-colors">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200">جاري تجهيز أسئلة الاختبار...</h3>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-8 text-center max-w-xl mx-auto my-8 transition-colors">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">تعذر فتح الاختبار</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
        <button
          onClick={onFinish}
          className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer"
        >
          العودة لقائمة الاختبارات
        </button>
      </div>
    );
  }

  // --- SHOW RESULT SCREEN IF SUBMITTED ---
  if (submissionResult) {
    const { result, gradedBreakdown, examTitle } = submissionResult;
    return (
      <div className="max-w-3xl mx-auto space-y-6 my-6">
        {/* Score Summary Card */}
        <div
          className={`rounded-2xl border p-8 text-center shadow-lg ${
            result.passed
              ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 border-emerald-700 text-white'
              : 'bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 border-rose-700 text-white'
          }`}
        >
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center mb-4 border border-white/20">
            {result.passed ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-300" />
            ) : (
              <XCircle className="w-10 h-10 text-rose-300" />
            )}
          </div>

          <span className="text-xs font-semibold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full">
            نتيجة الاختبار الفورية
          </span>
          <h2 className="text-2xl font-black mt-2 mb-1">{examTitle}</h2>
          <p className="text-sm opacity-80 mb-6">
            الطالب: {student.name} | رقم المحاولة: #{result.attemptNumber}
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto bg-black/20 p-4 rounded-xl backdrop-blur-xs border border-white/10 text-center">
            <div>
              <div className="text-xs opacity-75">النسبة المئوية</div>
              <div className="text-3xl font-black mt-1">{result.scorePercent}%</div>
            </div>
            <div>
              <div className="text-xs opacity-75">الدرجة الكلية</div>
              <div className="text-3xl font-black mt-1">
                {result.score}/{result.totalPossiblePoints}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-75">الحالة</div>
              <div className="text-xl font-bold mt-2">
                {result.passed ? 'ناجح متميز 🎉' : 'تحتاج لمراجعة 📖'}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={onFinish}
              className="px-6 py-2.5 bg-white text-slate-900 font-bold rounded-xl shadow hover:bg-slate-100 transition-colors text-sm"
            >
              العودة لقائمة الاختبارات
            </button>
          </div>
        </div>

        {/* Detailed Breakdown with Explanations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            مراجعة الإجابات ونموذج الإجابة التوضيحي للأستاذ إمام يوسف
          </h3>

          <div className="space-y-6">
            {gradedBreakdown.map((item: any, idx: number) => (
              <div
                key={item.questionId}
                className={`p-5 rounded-xl border ${
                  item.isCorrect
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    سؤال {idx + 1}: {item.questionText}
                  </span>
                  <span
                    className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      item.isCorrect
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {item.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        صحيحة (+{item.points})
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        إجابة خاطئة (0/{item.points})
                      </>
                    )}
                  </span>
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {item.options.map((opt: string, optIdx: number) => {
                    const isStudentChoice = item.chosenIndex === optIdx;
                    const isCorrectAnswer = item.correctIndex === optIdx;

                    let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                    if (isCorrectAnswer) {
                      btnStyle = 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100 font-bold ring-1 ring-emerald-500';
                    } else if (isStudentChoice && !item.isCorrect) {
                      btnStyle = 'bg-rose-100 dark:bg-rose-900/60 border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-100 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isCorrectAnswer && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                            الإجابة النموذجية
                          </span>
                        )}
                        {isStudentChoice && !isCorrectAnswer && (
                          <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded">
                            إجابتك
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {item.explanation && (
                  <div className="mt-3 bg-white/80 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 shrink-0">💡 توضيح القاعدة:</span>
                    <span>{item.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE EXAM INTERACTION ---
  const currentQuestion = exam.questions[currentIndex];
  const totalQuestions = exam.questions.length;
  const answeredQuestionsCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 my-6">
      {/* Top Floating Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between transition-colors">
        <div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded">
            {exam.unit}
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{exam.title}</h2>
        </div>

        {/* Timer */}
        {secondsRemaining !== null && (
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono font-bold text-sm ${
              secondsRemaining < 120
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>
        )}
      </div>

      {/* Question Progression Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
          <span>
            سؤال {currentIndex + 1} من {totalQuestions}
          </span>
          <span>
            تمت الإجابة على: {answeredQuestionsCount}/{totalQuestions}
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Bubbles Quick Jump */}
        <div className="flex flex-wrap gap-2 mt-4">
          {exam.questions.map((q, idx) => {
            const isAnswered = answers[String(q.id)] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : isAnswered
                    ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-semibold border border-indigo-300 dark:border-indigo-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Card */}
      {currentQuestion && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-4">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded">
              سؤال {currentIndex + 1} ({currentQuestion.points} درجات)
            </span>
            <span>اختر إجابة واحدة صحيحة</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed mb-6" dir="ltr">
            {currentQuestion.questionText}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((optionText, optIdx) => {
              const isSelected = answers[String(currentQuestion.id)] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                  className={`w-full p-4 rounded-xl border text-right transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-950 dark:text-indigo-200 font-bold ring-1 ring-indigo-600'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-sm" dir="ltr">
                      {optionText}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              السابق
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                التالي
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-100 dark:shadow-none transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'جاري تصحيح الاختبار...' : 'تسليم الاختبار وإنهاء المحاولة'}
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
