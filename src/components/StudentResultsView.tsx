import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, Clock, Calendar, BookOpen, TrendingUp, BarChart2, Printer, ShieldCheck } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Student } from '../types.ts';
import * as dataService from '../lib/dataService.ts';

interface StudentResultsViewProps {
  student: Student;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({ student }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'timeline' | 'comparison'>('timeline');

  useEffect(() => {
    fetchResults();
  }, [student.id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await dataService.getResults(student.id);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalExamsTaken = results.length;
  const passedExamsCount = results.filter((r) => r.passed).length;
  const averageScore =
    totalExamsTaken > 0
      ? Math.round(results.reduce((acc, curr) => acc + curr.scorePercent, 0) / totalExamsTaken)
      : 0;

  // Process data chronologically (oldest to newest) for timeline progression
  const chronologicalResults = [...results].reverse();

  const timelineChartData = chronologicalResults.map((item, index) => {
    const dateFormatted = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('ar-EG', {
          month: 'numeric',
          day: 'numeric',
        })
      : '';
    const safeTitle = item.examTitle || `اختبار ${index + 1}`;
    const shortTitle = safeTitle.length > 18 ? safeTitle.substring(0, 18) + '...' : safeTitle;
    return {
      name: `اختبار ${index + 1}`,
      examTitle: safeTitle,
      date: dateFormatted,
      score: item.scorePercent ?? 0,
      passingScore: 60,
      passed: Boolean(item.passed),
      attempt: item.attemptNumber || 1,
      displayLabel: `${shortTitle} (محاولة ${item.attemptNumber || 1})`,
    };
  });

  return (
    <div className="space-y-6">
      {/* Overview Stats Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              بيان درجات معتمد ورسمي
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">سجل درجات الطالب وتقارير الأداء</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              الطالب: <strong className="text-slate-800 dark:text-slate-200">{student.name}</strong> | كود التفعيل: <span className="font-mono text-indigo-700 dark:text-indigo-400 font-bold">{student.codeUsed}</span>
            </p>
          </div>

          <button
            onClick={() => window.print()}
            type="button"
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer border border-transparent dark:border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة بيان الدرجات</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 text-center">
            <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">متوسط درجاتك</div>
            <div className="text-3xl font-black text-indigo-900 dark:text-indigo-100">{averageScore}%</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-4 text-center">
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">الاختبارات المجتازة</div>
            <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
              {passedExamsCount} / {totalExamsTaken}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">كود الطالب المفعل</div>
            <div className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wider mt-1.5">
              {student.codeUsed}
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      {timelineChartData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                تحليل منحنى التطور الأكاديمي
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">تطور مستوى درجات الطالب عبر الوقت</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                يوضح الرسم البياني تقدمك في الاختبارات المتتالية وتخطي حد النجاح (60%).
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setChartType('timeline')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  chartType === 'timeline'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>المنحنى الزمني</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('comparison')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  chartType === 'comparison'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>أعمدة الدرجات</span>
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'timeline' ? (
                <AreaChart
                  data={timelineChartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
                >
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    stroke="#94a3b8"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div
                            className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 font-['Cairo',sans-serif] border border-slate-700"
                            dir="rtl"
                          >
                            <div className="font-bold text-slate-100 text-sm">{data.examTitle}</div>
                            <div className="text-slate-400">
                              التاريخ: <span className="text-slate-200">{data.date}</span> (محاولة #{data.attempt})
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                              <span>الدرجة المحققة:</span>
                              <span className="font-black text-amber-300 text-sm">{data.score}%</span>
                            </div>
                            <div className="text-[11px]">
                              {data.score >= 60 ? (
                                <span className="text-emerald-400 font-bold">✓ ممتاز - اجتياز بنجاح</span>
                              ) : (
                                <span className="text-rose-400 font-bold">✕ بحاجة لمزيد من المراجعة</span>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={60}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'حد النجاح (60%)',
                      position: 'insideBottomRight',
                      fill: '#f59e0b',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 3 }}
                    fillOpacity={1}
                    fill="url(#scoreColor)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={timelineChartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    stroke="#94a3b8"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div
                            className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 font-['Cairo',sans-serif] border border-slate-700"
                            dir="rtl"
                          >
                            <div className="font-bold text-slate-100 text-sm">{data.examTitle}</div>
                            <div className="text-slate-400">التاريخ: {data.date}</div>
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                              <span>الدرجة:</span>
                              <span className="font-black text-amber-300 text-sm">{data.score}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={60}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={45}>
                    {timelineChartData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.score >= 60 ? '#6366f1' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
                درجة الاختبار
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-amber-500 inline-block" />
                حد الاجتياز (60%)
              </span>
              {chartType === 'comparison' && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  أقل من حد الاجتياز
                </span>
              )}
            </div>
            <div className="text-slate-400 dark:text-slate-500">
              إجمالي الاختبارات المكتملة في التحليل: {timelineChartData.length}
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4">قائمة الاختبارات المؤداة</h3>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">جاري جلب السجل...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm">لم تقم بأداء أي اختبارات بعد. ابدأ أول اختبار الآن لتسجيل درجاتك وتفعيل الرسم البياني!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {results.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.passed
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                      }`}
                    >
                      {item.passed ? 'ناجح' : 'لم يجتز'}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">محاولة #{item.attemptNumber}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.examTitle}</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.floor(item.timeSpentSeconds / 60)} دقيقة و {item.timeSpentSeconds % 60} ثانية
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right w-full sm:w-auto flex items-center justify-between sm:block bg-slate-50 dark:bg-slate-800/60 sm:bg-transparent dark:sm:bg-transparent p-3 sm:p-0 rounded-xl">
                  <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{item.scorePercent}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    الدرجة: {item.score} من {item.totalPossiblePoints}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
