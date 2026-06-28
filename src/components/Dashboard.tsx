/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentProgress, SpacedReminder } from '../types';
import { CURRICULUM } from '../data/curriculum';
import { SUDAN_EXAMS } from '../data/exams';
import { VIRTUAL_LABS } from '../data/labs';
import { motion } from 'motion/react';
import { 
  Award, BookOpen, Clock, TrendingUp, AlertTriangle, 
  ArrowLeftRight, CheckCircle2, Star, Beaker, FileText, 
  Heart, Calendar, Coffee, Sparkles
} from 'lucide-react';

interface DashboardProps {
  progress: StudentProgress;
  reminders: SpacedReminder[];
  onNavigateToSection: (tabId: string, extraId?: string) => void;
}

export default function Dashboard({ progress, reminders, onNavigateToSection }: DashboardProps) {
  // Calculations
  const totalLessons = CURRICULUM.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const completedCount = progress.completedLessonIds.length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Spaced reminders overdue count
  const overdueCount = reminders.filter(r => r.status !== 'reviewed' && new Date(r.scheduledTime).getTime() < Date.now()).length;

  // Next pending review due today or older
  const dueReview = reminders.find(r => r.status !== 'reviewed' && new Date(r.scheduledTime).getTime() <= Date.now());

  // Find first uncompleted lesson
  const nextNewLesson = CURRICULUM.flatMap(u => u.lessons.map(l => ({ ...l, unitNumber: u.number, unitTitle: u.title })))
    .find(lesson => !progress.completedLessonIds.includes(lesson.id));

  const totalExams = SUDAN_EXAMS.length;
  const completedExamsCount = Object.keys(progress.quizScores).length;

  // Average Quiz Score
  const quizScoresArray = Object.values(progress.quizScores);
  const averageScore = quizScoresArray.length > 0 
    ? Math.round(quizScoresArray.reduce((sum, score) => sum + score, 0) / quizScoresArray.length) 
    : 0;

  // Academic Bookmarks computation
  const bookmarkedLessons = CURRICULUM.flatMap(u => u.lessons.map(l => ({ ...l, unitId: u.id, unitTitle: u.title })))
    .filter(l => progress.bookmarkedLessonIds?.includes(l.id));

  const bookmarkedUnits = CURRICULUM.filter(u => progress.bookmarkedUnitIds?.includes(u.id));

  const bookmarkedLabs = VIRTUAL_LABS.filter(l => progress.bookmarkedLabIds?.includes(l.id));

  // Contextual Smart Recommendations
  const getSmartRecommendations = () => {
    const recs: { title: string; desc: string; tab: string; urgency: 'high' | 'medium'; extraId?: string }[] = [];

    // If no lessons completed
    if (completedCount === 0) {
      recs.push({
        title: 'ابدأ دراستك الذاتية الأولى',
        desc: 'ننصحك بالبدء بقراءة الدرس الأول من الوحدة الأولى: "مفهوم الغذاء والتغذية وأهميتهما" لبناء ركيزة ممتازة.',
        tab: 'lessons',
        urgency: 'high'
      });
    }

    // Overdue review reminders
    if (overdueCount > 0) {
      recs.push({
        title: 'مراجعات متأخرة تنتظر إنجازك',
        desc: `لديك عدد ${overdueCount} جلسة مراجعة متأخرة لدروس سابقة. قم بمراجعتها فوراً لحفظ الفهم الفسيولوجي بالذاكرة طويلة المدى.`,
        tab: 'alerts',
        urgency: 'high'
      });
    }

    // Weakness diagnostic alerts
    if (progress.weaknesses.includes('الجهاز البولي والنيفرون والإخراج')) {
      recs.push({
        title: 'عزز مهاراتك: تركيب الكلية والنيفرون',
        desc: 'اكتشفنا تراجعاً طفيفاً في تذكر تركيب النيفرون ومحفظة بومان. ننصحك بإجراء "ورقة عمل 3" واستكشاف الرسم التوضيحي بالوحدة الرابعة.',
        tab: 'worksheets',
        urgency: 'high'
      });
    }

    if (progress.weaknesses.includes('التغذية والهضم')) {
      recs.push({
        title: 'مراجعة موجهة: إنزيمات القناة الهضمية',
        desc: 'ننصحك بتجربة "الدرس الثالث من الوحدة الأولى" ومطابقة إنزيم الببسين وحمض HCl لتثبيت الفهم.',
        tab: 'lessons',
        urgency: 'medium'
      });
    }

    // If quizzes are unattempted
    if (completedExamsCount === 0) {
      recs.push({
        title: 'اختبر استيعابك الأكاديمي',
        desc: 'حاكي امتحانات الشهادة الثانوية السودانية واعرف درجتك التقديرية الفورية بنقرة زر واحدة في قسم الاختبارات القياسية.',
        tab: 'exams',
        urgency: 'medium'
      });
    }

    // Fallback default recommendation
    if (recs.length === 0) {
      recs.push({
        title: 'جرب مختبر التجارب الفسيولوجي التفاعلي',
        desc: 'قم بإجراء تجربة البناء الضوئي لنبات الإيلوديا أو مطابقة فصائل الدم ومراقبة تخثر البلازما بشكل حيوي.',
        tab: 'labs',
        extraId: 'lab_photosynthesis',
        urgency: 'medium'
      });
    }

    return recs;
  };

  const recommendations = getSmartRecommendations();

  return (
    <div className="space-y-6 text-right" id="dashboard-wrapper">
      
      {/* 🌟 INTEGRATED MORNING BRIEF (الموجز الصباحي) - Slide 5 and Slide 10 */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-600/35"
        id="morning-brief-card"
      >
        {/* Subtle decorative background icons */}
        <div className="absolute left-6 bottom-4 text-emerald-600/25 pointer-events-none hidden sm:block">
          <Coffee className="w-32 h-32 rotate-12" />
        </div>
        <div className="absolute right-10 top-2 text-white/5 pointer-events-none">
          <Sparkles className="w-20 h-20" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md text-emerald-300">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-200/90 font-black">خطتك اليومية المختصرة</span>
                <h2 className="text-base sm:text-lg font-black text-white">الموجز الصباحي للتعلم العميق 🌤️</h2>
              </div>
            </div>
            <div className="bg-emerald-650/40 text-[10px] font-bold px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center space-x-1.5 space-x-reverse font-mono">
              <span>اليوم الدراسي الحالي</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* 1. New Suggested Lesson */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 backdrop-blur-xs flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 space-x-reverse text-emerald-300 text-[10px] font-black">
                  <BookOpen className="w-4 h-4 ml-1" />
                  <span>درس جديد مقترح اليوم</span>
                </div>
                {nextNewLesson ? (
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white">{nextNewLesson.title}</h3>
                    <span className="text-[10px] text-emerald-200/80 block font-semibold">الوحدة {nextNewLesson.unitNumber}: {nextNewLesson.unitTitle}</span>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-100/70 font-medium">تهانينا! لقد أكملت دراسة جميع دروس المنهج الأحادي بنجاح. 🎓</p>
                )}
              </div>
              {nextNewLesson && (
                <button
                  onClick={() => onNavigateToSection('lessons')}
                  className="w-full mt-3 bg-white text-emerald-900 hover:bg-emerald-50 py-2 px-4 rounded-xl text-[11px] font-black shadow-3xs transition-all flex items-center justify-center space-x-2 space-x-reverse"
                >
                  <span>ابدأ دراسة الدرس الآن</span>
                  <ArrowLeftRight className="w-3.5 h-3.5 mr-1 text-emerald-800 rotate-180" />
                </button>
              )}
            </div>

            {/* 2. Spaced Repetition Due Review */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 backdrop-blur-xs flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 space-x-reverse text-emerald-300 text-[10px] font-black">
                  <Calendar className="w-4 h-4 ml-1" />
                  <span>مراجعة تكرارية مستحقة اليوم</span>
                </div>
                {dueReview ? (
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white">{dueReview.lessonTitle}</h3>
                    <span className="text-[10px] text-emerald-200/80 block font-semibold">تثبيت الحفظ: {dueReview.unitTitle}</span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-extrabold text-emerald-200">الذاكرة طويلة المدى مستقرة 🌟</h3>
                    <span className="text-[10px] text-emerald-200/70 block font-medium">ليس لديك مراجعات دورية متأخرة اليوم. رائع!</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onNavigateToSection(dueReview ? 'alerts' : 'lessons')}
                className="w-full mt-3 bg-emerald-650 hover:bg-emerald-600/80 border border-white/10 text-white py-2 px-4 rounded-xl text-[11px] font-black transition-all flex items-center justify-center space-x-2 space-x-reverse"
              >
                <span>{dueReview ? 'ابدأ جلسة المراجعة الفورية' : 'تصفح جدول التكرار المتباعد'}</span>
                <ArrowLeftRight className="w-3.5 h-3.5 mr-1 text-emerald-100 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Visual Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        {/* Card 1: Completed lessons */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-600">
            <BookOpen className="w-6 h-6 text-[#28a745]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase">الدروس المنجزة</span>
            <div className="flex items-baseline space-x-1.5 space-x-reverse justify-end">
              <span className="text-2xl font-extrabold text-[#272522] font-mono">{completedCount}</span>
              <span className="text-xs text-slate-500">/ {totalLessons} درس</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 font-mono flex justify-end pt-1">{completionPercentage}% اكتمال المنهج</span>
          </div>
        </div>

        {/* Card 2: Average Quiz grade */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-rose-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase">معدل التحصيل الدراسي</span>
            <div className="flex items-baseline space-x-1.5 space-x-reverse justify-end">
              <span className="text-2xl font-extrabold text-[#272522] font-mono">{averageScore}%</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 flex justify-end pt-1">عدد الامتحانات: {completedExamsCount}</span>
          </div>
        </div>

        {/* Card 3: Study hours or logged time */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 text-sky-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase">وقت الدراسة النشطة</span>
            <div className="flex items-baseline space-x-1.5 space-x-reverse justify-end">
              <span className="text-2xl font-extrabold text-[#272522] font-mono">{progress.timeSpentMinutes}</span>
              <span className="text-xs text-slate-500">دقيقة</span>
            </div>
            <span className="text-[10px] font-bold text-sky-600 flex justify-end pt-1">تحصيل ذاتي تراكمي</span>
          </div>
        </div>

        {/* Card 4: Overdue periodic reviews */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-600">
            <TrendingUp className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase">مراجعات دورية معلقة</span>
            <div className="flex items-baseline space-x-1.5 space-x-reverse justify-end">
              <span className="text-2xl font-extrabold text-[#272522] font-mono">{overdueCount}</span>
              <span className="text-xs text-slate-500">مراجعة مطلوبة</span>
            </div>
            <span className="text-[10px] font-bold text-amber-600 flex justify-end pt-1">آلية التكرار المتباعد</span>
          </div>
        </div>
      </div>

      {/* Section: Academic Bookmarks (المفضلة الأكاديمية) */}
      <div className="bg-white border border-slate-200/85 rounded-2xl p-5 space-y-4 shadow-xs animate-fadeIn" id="academic-favorites-section">
        <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400">تصفح سريع ومباشر للدروس والمعامل والوحدات المفضلة</span>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Heart className="w-4 h-4 text-rose-500 fill-current ml-1" />
            <h3 className="text-sm font-extrabold text-slate-800">المفضلة الأكاديمية الخاصة بي</h3>
          </div>
        </div>

        {bookmarkedLessons.length === 0 && bookmarkedUnits.length === 0 && bookmarkedLabs.length === 0 ? (
          <div className="bg-slate-50/70 border border-slate-200/50 rounded-xl p-6 text-center text-xs text-slate-500 font-medium space-y-1">
            <p>لا توجد أي عناصر في المفضلة حالياً.</p>
            <p className="text-[10px] text-slate-400 leading-normal">
              انقر على أيقونة النجمة (⭐) المتواجدة بجوار الدروس أو الوحدات أو التجارب العملية التفاعلية لإضافتها هنا والوصول إليها بلمسة واحدة!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Bookmarked Units */}
            <div className="space-y-2 bg-slate-50/40 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">الوحدات المفضلة ({bookmarkedUnits.length})</span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {bookmarkedUnits.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => onNavigateToSection('lessons', unit.id)}
                    className="w-full text-right p-2.5 rounded-xl bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 text-xs font-bold text-slate-700 flex items-center justify-between shadow-3xs transition-all"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600 rotate-180" />
                    <span className="truncate">الوحدة {unit.number}: {unit.title}</span>
                  </button>
                ))}
                {bookmarkedUnits.length === 0 && (
                  <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl text-[10px] text-slate-400">
                    لا توجد وحدات مفضلة بعد
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Bookmarked Lessons */}
            <div className="space-y-2 bg-slate-50/40 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">الدروس المفضلة ({bookmarkedLessons.length})</span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {bookmarkedLessons.map(lesson => (
                  <button
                    key={lesson.id}
                    onClick={() => onNavigateToSection('lessons', lesson.id)}
                    className="w-full text-right p-2.5 rounded-xl bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-200 text-xs font-bold text-slate-700 flex items-center justify-between shadow-3xs transition-all"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#28a745] rotate-180" />
                    <span className="truncate">{lesson.title}</span>
                  </button>
                ))}
                {bookmarkedLessons.length === 0 && (
                  <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl text-[10px] text-slate-400">
                    لا توجد دروس مفضلة بعد
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Bookmarked Labs */}
            <div className="space-y-2 bg-slate-50/40 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">المعامل المفضلة ({bookmarkedLabs.length})</span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {bookmarkedLabs.map(lab => (
                  <button
                    key={lab.id}
                    onClick={() => onNavigateToSection('labs', lab.id)}
                    className="w-full text-right p-2.5 rounded-xl bg-white hover:bg-rose-50/40 border border-slate-200 hover:border-rose-200 text-xs font-bold text-slate-700 flex items-center justify-between shadow-3xs transition-all"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-rose-600 rotate-180" />
                    <span className="truncate">{lab.title}</span>
                  </button>
                ))}
                {bookmarkedLabs.length === 0 && (
                  <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl text-[10px] text-slate-400">
                    لا توجد تجارب مفضلة بعد
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Strengths & Weaknesses vs. Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-diagnostics">
        {/* Left Column: Strengths & Weaknesses (Col-span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400">تحديث فوري من النتائج</span>
              <h3 className="text-sm font-extrabold text-slate-800">التحليل التشخيصي الاستباقي للنقاط الدراسية</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weaknesses card */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse text-amber-700 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 ml-1" />
                  <span>نقاط الضعف المكتشفة (تحتاج لمراجعة):</span>
                </div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {progress.weaknesses.length > 0 ? (
                    progress.weaknesses.map((weak, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-100 text-xs font-semibold text-slate-700 shadow-2xs">
                        • {weak}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-medium py-4 text-center">لا توجد نقاط ضعف مكتشفة حالياً. واصل التفوق بالامتحانات والتدريب!</p>
                  )}
                </div>
              </div>

              {/* Strengths card */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse text-emerald-700 font-bold text-xs">
                  <Star className="w-4 h-4 ml-1" />
                  <span>نقاط القوة المستقرة (مستواك ممتاز):</span>
                </div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {progress.strengths.length > 0 ? (
                    progress.strengths.map((strong, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-100 text-xs font-semibold text-[#28a745] shadow-2xs">
                        ✓ {strong}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-medium py-4 text-center">لم يتم تسجيل نقاط قوة كبرى بعد. أكمل دراسة الوحدات والاختبارات لتحديثها.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Completion Progressive Bar */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>% {completionPercentage}</span>
                <span>معدل التقدم الإجمالي في المنهج الأكاديمي</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-emerald-600 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Smart Study recommendations (Col-span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 min-h-[290px] shadow-xs">
            <div className="border-b border-slate-100 pb-2 text-right">
              <h3 className="text-sm font-extrabold text-slate-800">أولويات المذاكرة الموصى بها</h3>
            </div>

            <div className="space-y-3 text-right">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                    rec.urgency === 'high'
                      ? 'bg-rose-50/70 border-rose-200/70 text-rose-950 hover:border-rose-300'
                      : 'bg-slate-50 border-slate-200/60 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      rec.urgency === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {rec.urgency === 'high' ? 'أولوية عاجلة' : 'موصى به'}
                    </span>
                    <h4 className="font-extrabold text-slate-800">{rec.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                    {rec.desc}
                  </p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onNavigateToSection(rec.tab, rec.extraId)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 space-x-reverse"
                    >
                      <span>انتقل إلى القسم</span>
                      <ArrowLeftRight className="w-3 h-3 mr-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
