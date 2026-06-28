/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { SUDAN_EXAMS, generateSudanExam } from '../data/exams';
import { StudentProgress, Question } from '../types';
import { motion } from 'motion/react';
import { Award, Timer, ClipboardCheck, AlertTriangle, RefreshCw, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ExamsSectionProps {
  progress: StudentProgress;
  onUpdateProgress: (updater: (prev: StudentProgress) => StudentProgress) => void;
}

export default function ExamsSection({ progress, onUpdateProgress }: ExamsSectionProps) {
  const [exam, setExam] = useState(() => generateSudanExam());
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => exam.durationMinutes * 60);
  const [isTimerActive, setIsTimerActive] = useState(true);

  const activeSection = exam.sections[activeSectionIdx];

  const handleRegenerateExam = () => {
    const newExam = generateSudanExam();
    setExam(newExam);
    setAnswers({});
    setIsSubmitted(false);
    setTimeLeft(newExam.durationMinutes * 60);
    setIsTimerActive(true);
    setActiveSectionIdx(0);
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (!isTimerActive || isSubmitted) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerActive(false);
          setIsSubmitted(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, isSubmitted]);

  const handleAnswerSelect = (questionId: string, value: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Grade Exam and Update Student Analytics
  const handleGradeExam = () => {
    setIsSubmitted(true);
    setIsTimerActive(false);

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const weakConceptIds: string[] = [];
    const strongConceptIds: string[] = [];

    exam.sections.forEach(section => {
      section.questions.forEach(q => {
        totalPoints += q.points;
        const userAnswer = (answers[q.id] || '').trim().toLowerCase();
        const correctAnswer = q.correctAnswer.trim().toLowerCase();

        // Check matching
        const isCorrect = userAnswer === correctAnswer || 
          (q.type === 'explain-why' && userAnswer.length > 5 && (correctAnswer.split(' ').some(w => userAnswer.includes(w)) || userAnswer.includes('حماية') || userAnswer.includes('ترشيح') || userAnswer.includes('الأجسام المضادة')));

        if (isSafeMatch(q, userAnswer)) {
          earnedPoints += q.points;
          if (!strongConceptIds.includes(q.unitId)) {
            strongConceptIds.push(q.unitId);
          }
        } else {
          if (!weakConceptIds.includes(q.unitId)) {
            weakConceptIds.push(q.unitId);
          }
        }
      });
    });

    const scorePercentage = Math.round((earnedPoints / totalPoints) * 100);

    // Update parent state
    onUpdateProgress(prev => {
      const updatedScores = { ...prev.quizScores, [exam.id]: scorePercentage };
      
      // Update weaknesses/strengths based on units
      const unitMap: Record<string, string> = {
        unit_1: 'التغذية والهضم',
        unit_2: 'الجهاز الدوري والدم والـ Rh',
        unit_3: 'التنفس الخلوي والهوائي',
        unit_4: 'الجهاز البولي والنيفرون والإخراج',
        unit_5: 'الأوكسينات والغدد الصماء'
      };

      const currentWeaknesses = [...prev.weaknesses];
      weakConceptIds.forEach(id => {
        const title = unitMap[id];
        if (title && !currentWeaknesses.includes(title)) {
          currentWeaknesses.push(title);
        }
      });

      const currentStrengths = [...prev.strengths];
      strongConceptIds.forEach(id => {
        const title = unitMap[id];
        if (title && !currentStrengths.includes(title)) {
          currentStrengths.push(title);
        }
      });

      return {
        ...prev,
        quizScores: updatedScores,
        weaknesses: currentWeaknesses.filter(w => !strongConceptIds.map(id => unitMap[id]).includes(w)),
        strengths: currentStrengths
      };
    });
  };

  const isSafeMatch = (q: Question, userAnswer: string) => {
    const cleanUser = userAnswer.trim().toLowerCase();
    const cleanCorrect = q.correctAnswer.trim().toLowerCase();
    if (cleanUser === cleanCorrect) return true;
    
    // Fuzzy matching for written/open Arabic inputs
    if (q.type === 'explain-why') {
      const keywords = q.correctAnswer.split(' ');
      let matches = 0;
      keywords.forEach(word => {
        if (word.length > 2 && cleanUser.includes(word.toLowerCase())) {
          matches++;
        }
      });
      return matches >= 2;
    }
    return false;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to calculate total earned points post-submission
  const calculateTotalEarnedPoints = () => {
    let earned = 0;
    exam.sections.forEach(sec => {
      sec.questions.forEach(q => {
        if (isSafeMatch(q, answers[q.id] || '')) {
          earned += q.points;
        }
      });
    });
    return earned;
  };

  const totalPossiblePoints = exam.sections.reduce((acc, sec) => acc + sec.questions.reduce((qAcc, q) => qAcc + q.points, 0), 0);
  const earnedPoints = calculateTotalEarnedPoints();
  const percentage = Math.round((earnedPoints / totalPossiblePoints) * 100);

  return (
    <div className="space-y-6 text-right" id="exams-section-wrapper">
      {/* Exam Header: Title and Timer */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 mb-2 inline-block">محاكاة امتحانات الشهادة الثانوية السودانية</span>
          <h2 className="text-lg font-extrabold text-slate-850">{exam.title}</h2>
          <p className="text-xs text-slate-650 mt-1">امتحان قياسي يشمل موضوعات التغذية، النقل، التنفس، الإخراج والتنسيق الهرموني.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRegenerateExam}
            className="flex items-center space-x-1.5 space-x-reverse bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-3xs"
            title="توليد نموذج امتحان جديد مكون من 30 سؤالاً عشوائياً"
          >
            <RefreshCw className="w-3.5 h-3.5 ml-1.5 animate-spin-slow" />
            <span>توليد امتحان جديد (30 سؤال)</span>
          </button>

          <div className="flex items-center space-x-3 space-x-reverse bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 shadow-2xs">
            <Timer className={`w-5 h-5 ml-2 ${timeLeft < 300 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500">الوقت المتبقي</span>
              <span className="text-base font-black text-slate-800 font-mono tracking-wider">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Sections list or Result summary */}
      {isSubmitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs"
          id="exam-result-board"
        >
          {/* Circular Result Radial / Badge */}
          <div className="flex flex-col items-center justify-center text-center space-y-3 py-6 border-b border-slate-100">
            <div className="relative w-24 h-24 rounded-full bg-slate-50 border-4 border-slate-200 flex items-center justify-center shadow-inner">
              <span className={`text-2xl font-black ${percentage >= 50 ? 'text-emerald-700' : 'text-rose-700'} font-mono`}>{percentage}%</span>
            </div>
            
            <h3 className="text-xl font-black text-slate-850">
              {percentage >= 75 ? 'ممتاز! أحسنت صنعاً' : percentage >= 50 ? 'جيد جداً! لقد نجحت بالامتحان' : 'يحتاج لمراجعة إضافية'}
            </h3>
            <p className="text-xs text-slate-650 max-w-md leading-relaxed font-semibold">
              لقد أحرزت {earnedPoints} درجة من أصل {totalPossiblePoints} درجة ممتازة. تم تحليل أدائك وحفظ التقدم، ونقاط الضعف المكتشفة أُضيفت إلى لوحة التحكم الخاصة بك للتركيز عليها.
            </p>

            <button
              onClick={handleRegenerateExam}
              className="mt-2 flex items-center space-x-1.5 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-5 rounded-xl font-bold text-xs transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 ml-1" />
              <span>توليد نموذج امتحان جديد (30 سؤال)</span>
            </button>
          </div>

          {/* Section results review list */}
          <div className="space-y-6">
            <h4 className="text-sm font-extrabold text-slate-800 border-r-2 border-emerald-600 pr-2">مراجعة وتصحيح الإجابات بالتفصيل:</h4>
            {exam.sections.map(sec => (
              <div key={sec.id} className="space-y-4">
                <h5 className="text-xs font-extrabold text-slate-700 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200 inline-block">{sec.title}</h5>
                <div className="space-y-3">
                  {sec.questions.map(q => {
                    const uAns = (answers[q.id] || '').trim();
                    const isCorrect = isSafeMatch(q, uAns);
                    return (
                      <div key={q.id} className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                        isCorrect ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs' : 'bg-rose-50/50 border-rose-200 shadow-2xs'
                      }`}>
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-850'
                          }`}>
                            {isCorrect ? 'إجابة صحيحة' : 'تحتاج للمراجعة'} (+{q.points} درجات)
                          </span>
                          <h6 className="font-extrabold text-slate-800">{q.questionText}</h6>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-0.5">إجابتك:</span>
                            <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {uAns || 'لم تتم الإجابة'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-0.5">الإجابة النموذجية النموذجية:</span>
                            <span className="text-emerald-700 font-bold">{q.correctAnswer}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-650 leading-relaxed font-semibold">
                          <span className="text-emerald-700 ml-1 font-bold">تفسير علمي:</span>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="exam-main-panel">
          {/* Left Column: Sections and navigation (Col-span 4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">أقسام ورقة الامتحان:</h4>
              <div className="space-y-2">
                {exam.sections.map((sec, idx) => {
                  const answeredCount = sec.questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length;
                  const totalInSec = sec.questions.length;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSectionIdx(idx)}
                      className={`w-full text-right p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                        activeSectionIdx === idx
                          ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <span className="text-[10px] bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full font-mono font-bold">
                        {answeredCount} / {totalInSec} مجاب
                      </span>
                      <span>{sec.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleGradeExam}
                  className="w-full flex items-center justify-center space-x-1.5 space-x-reverse bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-rose-600/10"
                >
                  <ClipboardCheck className="w-4 h-4 ml-2" />
                  <span>تسليم وتصحيح ورقة الإجابة</span>
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start space-x-2 space-x-reverse shadow-3xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 ml-2" />
              <div>
                <h5 className="text-xs font-bold text-amber-850">ملاحظة هامة للطلاب</h5>
                <p className="text-[10px] text-amber-700 leading-relaxed mt-1">
                  الرجاء الحرص على الإجابة عن كافة الأسئلة بدقة. في الأسئلة المقالية القصيرة (المصطلح والتعليل)، اكتب مصطلحاتك باللغة العربية بوضوح تام، وسيقوم محاكي التصحيح بوزارة التربية بتقييم ومقارنة الكلمات المفتاحية لتقدير الدرجة.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Active Question sheet (Col-span 8) */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-6 shadow-xs">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-mono font-bold">القسم {activeSectionIdx + 1} من {exam.sections.length}</span>
              <h3 className="text-base font-extrabold text-rose-700">{activeSection.title}</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-normal bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-semibold">
              {activeSection.instructions}
            </p>

            {/* Questions loop */}
            <div className="space-y-5">
              {activeSection.questions.map((q, qIdx) => {
                const currentAns = answers[q.id] || '';
                return (
                  <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3 shadow-3xs">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {q.points} درجات
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-800 leading-relaxed">
                        {qIdx + 1}. {q.questionText}
                      </h4>
                    </div>

                    {/* Rendering inputs based on type */}
                    {q.type === 'true-false' && (
                      <div className="flex space-x-3 space-x-reverse pt-2">
                        {['√', '×'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleAnswerSelect(q.id, opt)}
                            className={`flex-1 py-2.5 rounded-xl font-black text-sm border transition-all ${
                              currentAns === opt
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-black shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {opt === '√' ? 'صحيح (√)' : 'خطأ (×)'}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === 'multiple-choice' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                        {q.options?.map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleAnswerSelect(q.id, opt)}
                            className={`text-right p-3 rounded-xl border text-xs font-semibold transition-all ${
                              currentAns === opt
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black shadow-xs'
                                : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === 'explain-why' && (
                      <div className="pt-2">
                        <textarea
                          rows={2}
                          value={currentAns}
                          onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                          placeholder="اكتب إجابتك العلمية المفصلة باللغة العربية هنا..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed text-right shadow-3xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next / Prev Section controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                onClick={() => setActiveSectionIdx(prev => Math.min(exam.sections.length - 1, prev + 1))}
                disabled={activeSectionIdx === exam.sections.length - 1}
                className="flex items-center space-x-1.5 space-x-reverse bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-2 px-4 rounded-xl text-xs font-extrabold transition-all shadow-3xs disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>القسم التالي</span>
                <ChevronLeft className="w-4 h-4 mr-1.5" />
              </button>

              <button
                onClick={() => setActiveSectionIdx(prev => Math.max(0, prev - 1))}
                disabled={activeSectionIdx === 0}
                className="flex items-center space-x-1.5 space-x-reverse bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-2 px-4 rounded-xl text-xs font-extrabold transition-all shadow-3xs disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4 ml-1.5" />
                <span>القسم السابق</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
