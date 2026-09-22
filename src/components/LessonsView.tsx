import React, { useState } from 'react';
import { PlayCircle, Clock, BookOpen, ExternalLink, Search, Filter } from 'lucide-react';
import { Lesson } from '../types.ts';

interface LessonsViewProps {
  lessons: Lesson[];
  loading: boolean;
}

export const LessonsView: React.FC<LessonsViewProps> = ({ lessons, loading }) => {
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<Lesson | null>(null);

  const filteredLessons = lessons.filter((lesson) => {
    const matchesTerm = selectedTerm === 'all' || lesson.term === selectedTerm;
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lesson.description && lesson.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      lesson.unit.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTerm && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/10 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            المحتوى التعليمي التفاعلي
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">محاضرات وشروحات اللغة الإنجليزية</h2>
          <p className="text-indigo-200 text-sm mt-2 leading-relaxed">
            شروحات تفصيلية شاملة لكل جزئيات المنهج، القواعد، وحل الأسئلة المتقدمة مع أ. إمام يوسف.
          </p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث في الدروس والوحدات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
          />
        </div>

        {/* Term Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-2 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            الفصل:
          </span>
          {['all', 'الترم الأول', 'الترم الثاني'].map((term) => (
            <button
              key={term}
              onClick={() => setSelectedTerm(term)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedTerm === term
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {term === 'all' ? 'جميع الفصول' : term}
            </button>
          ))}
        </div>
      </div>

      {/* Active Video Player Modal / Preview */}
      {activeVideo && (
        <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700">
            <div>
              <span className="text-xs font-semibold text-indigo-400">{activeVideo.unit}</span>
              <h3 className="text-lg font-bold text-white">{activeVideo.title}</h3>
            </div>
            <button
              onClick={() => setActiveVideo(null)}
              className="text-xs font-medium text-slate-400 hover:text-white bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              إغلاق الفيديو
            </button>
          </div>
          <div className="aspect-video w-full bg-black flex items-center justify-center">
            {activeVideo.videoUrl.includes('youtube.com') || activeVideo.videoUrl.includes('youtu.be') ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${getYouTubeId(activeVideo.videoUrl)}?autoplay=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video controls className="w-full h-full" src={activeVideo.videoUrl} autoPlay>
                المتصفح الخاص بك لا يدعم تشغيل الفيديو.
              </video>
            )}
          </div>
          <div className="p-4 text-sm text-slate-300">
            {activeVideo.description || 'لا يوجد وصف إضافي لهذا الدرس.'}
          </div>
        </div>
      )}

      {/* Lessons Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse space-y-4">
              <div className="w-full h-36 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">لا توجد دروس مطابقة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            لم يتم العثور على أي دروس مطابقة لمعايير البحث الحالية.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Thumbnail / Header */}
                <div
                  onClick={() => setActiveVideo(lesson)}
                  className="relative aspect-video bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 cursor-pointer overflow-hidden flex items-center justify-center group-hover:opacity-95 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-8 h-8 fill-white/80 text-indigo-900" />
                  </div>
                  <div className="absolute top-3 right-3 bg-indigo-600/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                    {lesson.unit}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs">
                    <Clock className="w-3 h-3" />
                    <span>{lesson.durationMinutes} دقيقة</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/50 px-2 py-0.5 rounded">
                      {lesson.term}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">الدرس #{lesson.lessonNumber}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {lesson.description || 'شرح شامل للمنهج مع تدريبات ونماذج امتحانات ثانوية عامة.'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                <button
                  onClick={() => setActiveVideo(lesson)}
                  className="w-full mt-3 py-2.5 px-4 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>مشاهدة المحاضرة الآن</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper to extract YouTube ID
function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : 'dQw4w9WgXcQ';
}
