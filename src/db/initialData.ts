export interface FallbackCode {
  id: number;
  code: string;
  note: string;
  status: 'unused' | 'used' | 'disabled';
  usedByStudentName: string | null;
  usedByStudentPhone: string | null;
  createdAt: Date;
}

export const initialCodes: FallbackCode[] = [
  { id: 1, code: 'TOP-2025-A1', note: 'دفعة المتفوقين 2025 - الصف الثالث الثانوي', status: 'unused', usedByStudentName: null, usedByStudentPhone: null, createdAt: new Date() },
  { id: 2, code: 'TOP-2025-B2', note: 'مجموعة النخبة - سنتر التفوق', status: 'unused', usedByStudentName: null, usedByStudentPhone: null, createdAt: new Date() },
  { id: 3, code: 'EMAM-ENG-01', note: 'مجموعة مستر إمام يوسف', status: 'unused', usedByStudentName: null, usedByStudentPhone: null, createdAt: new Date() },
  { id: 4, code: 'EMAM-ENG-02', note: 'مجموعة مستر إمام يوسف', status: 'unused', usedByStudentName: null, usedByStudentPhone: null, createdAt: new Date() },
  { id: 5, code: 'VIP-EXAM-77', note: 'كود طلاب الأونلاين - منصة التفوق', status: 'unused', usedByStudentName: null, usedByStudentPhone: null, createdAt: new Date() },
];

export const initialLessons = [
  {
    id: 1,
    title: 'Unit 1: Past Simple vs Past Continuous & Used To',
    description: 'شرح تفصيلي شامل لزمني الماضي البسيط والماضي المستمر وقاعدة Used To مع حل أهم أفكار امتحانات الثانوية العامة.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    durationMinutes: 45,
    term: 'الترم الأول',
    unit: 'Unit 1: Cultural Identity',
    lessonNumber: 1,
    pdfAttachmentUrl: null,
    isPublished: true,
    createdAt: new Date(),
  },
  {
    id: 2,
    title: 'Unit 1: Essential Vocabulary & Collocations',
    description: 'أهم الكلمات والتعبيرات والمترادفات والمتضادات للوحدة الأولى وطريقة حفظها وتطبيقها على أسئلة الامتحانات.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    durationMinutes: 38,
    term: 'الترم الأول',
    unit: 'Unit 1: Cultural Identity',
    lessonNumber: 2,
    pdfAttachmentUrl: null,
    isPublished: true,
    createdAt: new Date(),
  },
  {
    id: 3,
    title: 'Unit 2: Present Perfect vs Present Perfect Continuous',
    description: 'الفرق الدقيق بين زمن المضارع التام والمضارع التام المستمر مع الكلمات الدالة مثل since و for و yet و already.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    durationMinutes: 50,
    term: 'الترم الأول',
    unit: 'Unit 2: Her Story',
    lessonNumber: 1,
    pdfAttachmentUrl: null,
    isPublished: true,
    createdAt: new Date(),
  },
  {
    id: 4,
    title: 'Skills Workshop: Mastering the Paragraph & Essay Writing',
    description: 'كيفية كتابة مقال نموذجي متناسق: الجملة الافتتاحية (Topic Sentence)، وجمل الدعم، والروابط الانتقالية، والخاتمة.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    durationMinutes: 30,
    term: 'الترم الأول',
    unit: 'Writing & Skills',
    lessonNumber: 1,
    pdfAttachmentUrl: null,
    isPublished: true,
    createdAt: new Date(),
  },
];

export const initialExam = {
  id: 1,
  title: 'اختبار شامل على Unit 1 (Grammar & Vocabulary)',
  description: 'اختبار تقييم شامل ومعتمد للأستاذ إمام يوسف لقياس مدى استيعاب جرامر الوحدة الأولى والكلمات الأساسية. الوقت محدد بـ 20 دقيقة.',
  timeLimitMinutes: 20,
  maxAttempts: 2,
  term: 'الترم الأول',
  unit: 'Unit 1: Cultural Identity',
  passingScorePercent: 60,
  isPublished: true,
  createdAt: new Date(),
};

export const initialQuestions = [
  {
    id: 1,
    examId: 1,
    questionText: 'While I _______ my English homework, the electricity went out.',
    type: 'multiple_choice',
    options: ['was doing', 'did', 'have done', 'had done'],
    correctOptionIndex: 0,
    explanation: 'بعد While نستخدم الماضي المستمر (was/were + v-ing) عندما يقطع الحدث المستمر حدث مفاجئ في الماضي البسيط.',
    points: 2,
  },
  {
    id: 2,
    examId: 1,
    questionText: 'When he was young, he _______ play tennis every Friday, but now he prefers football.',
    type: 'multiple_choice',
    options: ['uses to', 'used to', 'is used to', 'got used to'],
    correctOptionIndex: 1,
    explanation: 'تُستخدم used to + المصدر للتعبير عن عادة كانت تحدث في الماضي وتوقفت في الحاضر.',
    points: 2,
  },
  {
    id: 3,
    examId: 1,
    questionText: 'A good citizen should always _______ pride in his cultural heritage.',
    type: 'multiple_choice',
    options: ['make', 'take', 'do', 'bring'],
    correctOptionIndex: 1,
    explanation: 'التعبير الصحيح في اللغة الإنجليزية هو (take pride in) أي يفتخر بـ.',
    points: 2,
  },
  {
    id: 4,
    examId: 1,
    questionText: 'She has been working in the company _______ 2018.',
    type: 'multiple_choice',
    options: ['for', 'since', 'ago', 'in'],
    correctOptionIndex: 1,
    explanation: 'نستخدم since عندما نحدد نقطة بداية زمنية محددة مثل سنة أو يوم أو شهر مع المضارع التام.',
    points: 2,
  },
  {
    id: 5,
    examId: 1,
    questionText: 'Yesterday at 7 PM, my brother and I were studying English.',
    type: 'true_false',
    options: ['صحيحة لغوياً (True)', 'خاطئة لغوياً (False)'],
    correctOptionIndex: 0,
    explanation: 'صحيحة لأن تحديد وقت دقيق في الماضي (Yesterday at 7 PM) يتطلب استخدام الماضي المستمر.',
    points: 2,
  },
];
