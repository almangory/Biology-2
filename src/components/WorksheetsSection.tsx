/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { WORKSHEETS } from '../data/worksheets';
import { CURRICULUM } from '../data/curriculum';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Award, Eye, EyeOff, BookOpen, AlertCircle, 
  Settings, RefreshCw, Printer, Sparkles, Check, 
  X, Lock, Unlock, ChevronRight, ChevronLeft, Star, Heart
} from 'lucide-react';
import { StudentProgress } from '../types';

interface WorksheetsSectionProps {
  progress?: StudentProgress;
  onUpdateProgress?: (updater: (prev: StudentProgress) => StudentProgress) => void;
  onNavigateToTab?: (tabId: string) => void;
}

// Structuring questions for the dynamic worksheet builder
interface GeneratorQuestion {
  id: string;
  unitId: string;
  lessonId: string;
  type: 'true_false' | 'fill_blank' | 'matching' | 'diagram';
  questionText: string;
  correctAnswer?: string; // Used for true_false and fill_blank
  explanation: string;
  points: number;
  
  // Matching fields
  matchingLeft?: string[];
  matchingRight?: string[];
  matchingCorrectMap?: Record<string, string>;

  // Diagram fields
  diagramId?: 'chloroplast' | 'heart' | 'nephron';
  diagramTitle?: string;
  diagramLabels?: { num: number; label: string; options: string[] }[];
}

// High-quality question bank for the interactive Sudanese curriculum generator
const GENERATOR_QUESTIONS: GeneratorQuestion[] = [
  {
    id: 'g1',
    unitId: 'unit_1',
    lessonId: 'u1_l1',
    type: 'true_false',
    questionText: 'تعتبر الكربوهيدرات المصدر الأساسي والسرير لإنتاج الطاقة الخلوية السريعة في الكائنات الحية.',
    correctAnswer: 'صح',
    explanation: 'الجلوكوز والكربوهيدرات البسيطة هي أسرع المواد التي تأكسدها الخلايا لإنتاج الطاقة العاجلة ATP.',
    points: 2
  },
  {
    id: 'g2',
    unitId: 'unit_1',
    lessonId: 'u1_l1',
    type: 'true_false',
    questionText: 'يؤدي نقص البروتينات الحاد في غذاء الأطفال الصغار إلى الإصابة الفورية بمرض الكساح ولين العظام.',
    correctAnswer: 'خطأ',
    explanation: 'نقص البروتينات يسبب مرض الكواشيوركور (انتفاخ البطن والرشح)، بينما الكساح ينتج عن نقص فيتامين د والكالسيوم.',
    points: 2
  },
  {
    id: 'g3',
    unitId: 'unit_1',
    lessonId: 'u1_l1',
    type: 'fill_blank',
    questionText: 'يكشف كاشف اليود البني المصفر عن وجود _____ في عينات الغذاء حيث يتحول لونه فوراً للأزرق الداكن.',
    correctAnswer: 'النشا',
    explanation: 'يتفاعل اليود نوعياً مع النشا لينتج معقداً كيميائياً ذا لون أزرق مسود مميز.',
    points: 2
  },
  {
    id: 'g4',
    unitId: 'unit_1',
    lessonId: 'u1_l2',
    type: 'true_false',
    questionText: 'تحدث تفاعلات الظلام اللاضوئية (دورة كالفن) بداخل أغشية التيلاكوئيد في البلاستيدة الخضراء.',
    correctAnswer: 'خطأ',
    explanation: 'تفاعلات الظلام تحدث في السدى (الستروما) لعدم حاجتها المباشرة للضوء والكلوروفيل المتواجد بالتيلاكوئيد.',
    points: 2
  },
  {
    id: 'g5',
    unitId: 'unit_1',
    lessonId: 'u1_l2',
    type: 'fill_blank',
    questionText: 'الغاز المنطلق كناتج فسيولوجي ثانوي من عملية البناء الضوئي في نبات الإيلوديا المائي هو غاز _____.',
    correctAnswer: 'الأكسجين',
    explanation: 'ينتج الأكسجين من شطر جزيئات الماء في التفاعلات الضوئية للبناء الضوئي.',
    points: 2
  },
  {
    id: 'g6',
    unitId: 'unit_1',
    lessonId: 'u1_l2',
    type: 'diagram',
    questionText: 'تأمل الرسم التخطيطي للبلاستيدة الخضراء وحدد البيانات المرقمة من القائمة بدقة:',
    diagramId: 'chloroplast',
    diagramTitle: 'تركيب البلاستيدة الخضراء',
    diagramLabels: [
      { num: 1, label: 'غشاء خارجي', options: ['غشاء خارجي', 'غشاء داخلي', 'ستروما (سدى)', 'ثيلاكوئيد (جرانا)'] },
      { num: 2, label: 'غشاء داخلي', options: ['غشاء خارجي', 'غشاء داخلي', 'ستروما (سدى)', 'ثيلاكوئيد (جرانا)'] },
      { num: 3, label: 'ثيلاكوئيد (جرانا)', options: ['غشاء خارجي', 'غشاء داخلي', 'ستروما (سدى)', 'ثيلاكوئيد (جرانا)'] },
      { num: 4, label: 'ستروما (سدى)', options: ['غشاء خارجي', 'غشاء داخلي', 'ستروما (سدى)', 'ثيلاكوئيد (جرانا)'] }
    ],
    correctAnswer: '',
    explanation: 'تتألف البلاستيدة من غشاء مزدوج (خارجي وداخلي)، وحشوة تسمى الستروما تحتوي على صفائح مغلقة تسمى الثيلاكوئيد وتترتب كجرانا.',
    points: 4
  },
  {
    id: 'g7',
    unitId: 'unit_2',
    lessonId: 'u2_l1',
    type: 'true_false',
    questionText: 'قوة سحب النتح هي القوة الفيزيائية الرئيسية المسؤولة عن رفع الماء لأعلى الأشجار الباسقة بالسودان.',
    correctAnswer: 'صح',
    explanation: 'تبخر الماء من الثغور يولد شدّاً يسحب أعمدة الماء المتصلة بفعل قوى التماسك والتلاصق للأعلى.',
    points: 2
  },
  {
    id: 'g8',
    unitId: 'unit_2',
    lessonId: 'u2_l2',
    type: 'diagram',
    questionText: 'تأمل رسمة قلب الإنسان التخطيطية وحدد أسماء التراكيب المرقمة فسيولوجياً:',
    diagramId: 'heart',
    diagramTitle: 'مكونات قلب الإنسان والأوعية',
    diagramLabels: [
      { num: 1, label: 'شريان أورطي', options: ['شريان أورطي', 'أذين أيمن', 'أذين أيسر', 'بطين أيمن', 'بطين أيسر'] },
      { num: 2, label: 'أذين أيمن', options: ['شريان أورطي', 'أذين أيمن', 'أذين أيسر', 'بطين أيمن', 'بطين أيسر'] },
      { num: 3, label: 'أذين أيسر', options: ['شريان أورطي', 'أذين أيمن', 'أذين أيسر', 'بطين أيمن', 'بطين أيسر'] },
      { num: 4, label: 'بطين أيمن', options: ['شريان أورطي', 'أذين أيمن', 'أذين أيسر', 'بطين أيمن', 'بطين أيسر'] },
      { num: 5, label: 'بطين أيسر', options: ['شريان أورطي', 'أذين أيمن', 'أذين أيسر', 'بطين أيمن', 'بطين أيسر'] }
    ],
    correctAnswer: '',
    explanation: 'يتكون القلب من أربع حجرات؛ بطينين وأذينين، ويتصل بالبطين الأيسر الشريان الأورطي الأكبر لضخ الدم النقي للجسم.',
    points: 5
  },
  {
    id: 'g9',
    unitId: 'unit_2',
    lessonId: 'u2_l2',
    type: 'matching',
    questionText: 'صل فصائل الدم ومكوناتها بقواعد التبرع الآمن فسيولوجياً:',
    matchingLeft: ['فصيلة الدم O-', 'فصيلة الدم AB+', 'عامل ريزوس (Rh-)', 'بلازما فصيلة الدم A'],
    matchingRight: ['مستقبل عام لجميع الفصائل', 'واهب عام لجميع الفصائل', 'لا يحمل مولدات ضد لعامل ريزوس', 'تحتوي على أجسام مضادة لـ B'],
    matchingCorrectMap: {
      'فصيلة الدم O-': 'واهب عام لجميع الفصائل',
      'فصيلة الدم AB+': 'مستقبل عام لجميع الفصائل',
      'عامل ريزوس (Rh-)': 'لا يحمل مولدات ضد لعامل ريزوس',
      'بلازما فصيلة الدم A': 'تحتوي على أجسام مضادة لـ B'
    },
    explanation: 'تتحكم الأنتجينات والأجسام المضادة في قواعد نقل الدم الآمن لمنع تفاعلات التلازن الميتة.',
    points: 4
  },
  {
    id: 'g10',
    unitId: 'unit_3',
    lessonId: 'u3_l1',
    type: 'true_false',
    questionText: 'تتم عملية الترشيح الفائق للدم بشكل فسيولوجي بداخل الأنبوبة الملتوية البعيدة بالكلية.',
    correctAnswer: 'خطأ',
    explanation: 'تحدث عملية الترشيح الفائق في محفظة بومان (الكبة) نتيجة للضغط المرتفع للدم الداخل عبر الشريان الوارد.',
    points: 2
  },
  {
    id: 'g11',
    unitId: 'unit_3',
    lessonId: 'u3_l1',
    type: 'fill_blank',
    questionText: 'الهرمون الذي يفرز فسيولوجياً لإعادة امتصاص الماء بداخل القنوات الجامعة بالكلية لتفادي الجفاف هو هرمون _____.',
    correctAnswer: 'ADH',
    explanation: 'هرمون ADH (المانع لإدرار البول) يزيد من نفاذية القنوات للماء لإعادته للدم أثناء الصيام أو نقص المياه.',
    points: 2
  },
  {
    id: 'g12',
    unitId: 'unit_3',
    lessonId: 'u3_l1',
    type: 'diagram',
    questionText: 'حدد البيانات المرقمة على تركيب النيفرون الكلوي بدقة علمية:',
    diagramId: 'nephron',
    diagramTitle: 'تركيب النفرون الكلوي الوظيفي',
    diagramLabels: [
      { num: 1, label: 'محفظة بومان', options: ['محفظة بومان', 'أنبوبة ملتوية قريبة', 'التواء هنلي', 'قناة جامعة'] },
      { num: 2, label: 'أنبوبة ملتوية قريبة', options: ['محفظة بومان', 'أنبوبة ملتوية قريبة', 'التواء هنلي', 'قناة جامعة'] },
      { num: 3, label: 'التواء هنلي', options: ['محفظة بومان', 'أنبوبة ملتوية قريبة', 'التواء هنلي', 'قناة جامعة'] },
      { num: 4, label: 'قناة جامعة', options: ['محفظة بومان', 'أنبوبة ملتوية قريبة', 'التواء هنلي', 'قناة جامعة'] }
    ],
    correctAnswer: '',
    explanation: 'يبدأ النيفرون بمحفظة بومان، تليها الملتوية القريبة، ثم التواء هنلي الهابط والصاعد، والملتوية البعيدة، فالقناة الجامعة.',
    points: 4
  },
  {
    id: 'g13',
    unitId: 'unit_4',
    lessonId: 'u4_l1',
    type: 'true_false',
    questionText: 'تقوم جزر لانجرهانز بالبنكرياس بإفراز هرمون الإنسولين مباشرة لخفض تركيز الجلوكوز المرتفع بالدم.',
    correctAnswer: 'صح',
    explanation: 'يحفز الإنسولين خلايا الجسم والكبد على امتصاص الجلوكوز وتحويله إلى جليكوجين مخزن.',
    points: 2
  },
  {
    id: 'g14',
    unitId: 'unit_5',
    lessonId: 'u5_l3',
    type: 'fill_blank',
    questionText: 'مؤسس علم الوراثة الحديث وصاحب تجارب نبات البازلاء الشهيرة هو العالم النمساوي _____.',
    correctAnswer: 'مندل',
    explanation: 'العالم غريغور مندل هو واضع حجر الأساس وقوانين انعزال العوامل والتوزيع الحر لعلم الوراثة.',
    points: 2
  }
];

export default function WorksheetsSection({ progress, onUpdateProgress, onNavigateToTab }: WorksheetsSectionProps) {
  // Tabs: 'predefined' (جاهزة) or 'generator' (المولد الذكي)
  const [activeTab, setActiveTab] = useState<'predefined' | 'generator'>('predefined');

  // Static pre-defined worksheets state
  const [selectedWsId, setSelectedWorksheetId] = useState(WORKSHEETS[0].id);
  const activeWorksheet = WORKSHEETS.find(ws => ws.id === selectedWsId)!;
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // --- Generator Config States ---
  const [scope, setScope] = useState<'all' | 'unit' | 'lesson' | 'favorites'>('all');
  const [selectedUnitId, setSelectedUnitId] = useState('unit_1');
  const [selectedLessonId, setSelectedLessonId] = useState('u1_l1');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['true_false', 'fill_blank', 'matching', 'diagram']);
  const [numSheets, setNumSheets] = useState(1); // 1 to 20 sheets
  
  // Watermark removal state
  const [isWatermarkRemoved, setIsWatermarkRemoved] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Generated worksheet simulation state
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratorQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({}); // key: questionId, value: user input
  const [isGraded, setIsGraded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // Paging A4 sheets

  // Synchronize unit & lesson dropdowns
  const currentUnitObj = CURRICULUM.find(u => u.id === selectedUnitId);

  // Setup generator config upon mount / changes
  const handleToggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleToggleReveal = (taskId: string) => {
    setRevealedAnswers(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Build / Generate action
  const handleGenerateWorksheet = () => {
    setIsGraded(false);
    setUserAnswers({});
    setCurrentPage(0);

    // Simple inline shuffle helper
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    // Filter master pool based on selected scope & types
    let pool = [...GENERATOR_QUESTIONS];

    if (scope === 'unit') {
      pool = pool.filter(q => q.unitId === selectedUnitId);
    } else if (scope === 'lesson') {
      pool = pool.filter(q => q.lessonId === selectedLessonId);
    } else if (scope === 'favorites' && progress) {
      const bookmarked = progress.bookmarkedLessonIds || [];
      pool = pool.filter(q => bookmarked.includes(q.lessonId));
    }

    pool = pool.filter(q => selectedTypes.includes(q.type));

    if (pool.length === 0) {
      // Fallback to whole matching types if selection yields zero
      pool = GENERATOR_QUESTIONS.filter(q => selectedTypes.includes(q.type));
    }

    // Shuffle the filtered pool
    let uniquePool = shuffleArray(pool);
    const targetCount = numSheets * 3; // 3 questions per page is ideal for A4 format in UI

    // If pool is smaller than target count, pull extra questions of matching types from elsewhere to avoid repeats
    if (uniquePool.length < targetCount) {
      const extraMatching = GENERATOR_QUESTIONS.filter(
        q => selectedTypes.includes(q.type) && !uniquePool.some(uq => uq.id === q.id)
      );
      uniquePool = [...uniquePool, ...shuffleArray(extraMatching)];
    }

    // If still not enough, pull any unique questions of other types
    if (uniquePool.length < targetCount) {
      const fallbackExtra = GENERATOR_QUESTIONS.filter(
        q => !uniquePool.some(uq => uq.id === q.id)
      );
      uniquePool = [...uniquePool, ...shuffleArray(fallbackExtra)];
    }

    // Build the final question list ensuring completely unique IDs for React and solving states
    const finalQuestions: GeneratorQuestion[] = [];
    for (let i = 0; i < targetCount; i++) {
      const sourceQuestion = uniquePool[i] || uniquePool[i % uniquePool.length];
      if (sourceQuestion) {
        finalQuestions.push({
          ...sourceQuestion,
          id: `${sourceQuestion.id}_ws_${i}_${Date.now()}`
        });
      }
    }

    setGeneratedQuestions(finalQuestions);
  };

  // Grade action
  const handleGradeWorksheet = () => {
    setIsGraded(true);
  };

  // Check custom passcode for watermark removal
  const handleUnlockWatermark = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === '20302060') {
      setIsWatermarkRemoved(true);
      setShowPasswordBox(false);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // Get total score
  const getWorksheetScore = () => {
    let earned = 0;
    let total = 0;
    generatedQuestions.forEach(q => {
      total += q.points;
      const ans = userAnswers[q.id];
      if (q.type === 'true_false' && ans === q.correctAnswer) {
        earned += q.points;
      } else if (q.type === 'fill_blank' && ans?.trim() === q.correctAnswer) {
        earned += q.points;
      } else if (q.type === 'matching' && ans) {
        let matchCorrect = true;
        q.matchingLeft?.forEach(leftItem => {
          if (ans[leftItem] !== q.matchingCorrectMap?.[leftItem]) {
            matchCorrect = false;
          }
        });
        if (matchCorrect) earned += q.points;
      } else if (q.type === 'diagram' && ans) {
        let labelCorrect = true;
        q.diagramLabels?.forEach(lbl => {
          if (ans[lbl.num] !== lbl.label) {
            labelCorrect = false;
          }
        });
        if (labelCorrect) earned += q.points;
      }
    });
    return { earned, total, pct: total > 0 ? Math.round((earned / total) * 100) : 0 };
  };

  // Generate on load
  useEffect(() => {
    handleGenerateWorksheet();
  }, [numSheets, scope, selectedUnitId, selectedLessonId]);

  // Questions on the active page
  const questionsPerPage = 3;
  const startIndex = currentPage * questionsPerPage;
  const activePageQuestions = generatedQuestions.slice(startIndex, startIndex + questionsPerPage);

  return (
    <div className="space-y-6 text-right font-sans" id="worksheets-container">
      {/* Visual Header */}
      <div className="bg-gradient-to-r from-rose-50 to-emerald-50 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 flex items-center justify-end">
            <Sparkles className="w-5 h-5 text-rose-500 ml-2 animate-bounce" />
            أوراق العمل التفاعلية ومولد الامتحانات الفسيولوجية
          </h2>
          <p className="text-xs font-bold text-slate-600 leading-relaxed">
            اختبر معلوماتك فسيولوجياً، ولد أوراق عمل مخصصة بالمستوى، المنهج، والدرس مع التصحيح الفوري وإمكانية فك العلامة المائية.
          </p>
        </div>
        <div className="flex bg-white/80 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('predefined')}
            className={`py-2 px-4 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'predefined' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            نماذج أوراق العمل الوزارية الجاهزة
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`py-2 px-4 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'generator' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            مُولّد أوراق العمل والامتحانات الذكي (A4)
          </button>
        </div>
      </div>

      {activeTab === 'predefined' ? (
        // Predefined ministerial worksheets view
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3" id="ws-tab-bar">
            {WORKSHEETS.map(ws => (
              <button
                key={ws.id}
                onClick={() => {
                  setSelectedWorksheetId(ws.id);
                  setRevealedAnswers({});
                }}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                  selectedWsId === ws.id
                    ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4 ml-1.5" />
                <span>{ws.title}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    activeWorksheet.difficulty === 'سهل'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-250'
                      : activeWorksheet.difficulty === 'متوسط'
                      ? 'bg-amber-50 text-amber-800 border-amber-250'
                      : 'bg-rose-50 text-rose-800 border-rose-250'
                  }`}>
                    مستوى الصعوبة: {activeWorksheet.difficulty}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono">ID: {activeWorksheet.id}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-800">{activeWorksheet.title}</h3>
                  <div className="flex items-center space-x-1.5 space-x-reverse text-xs text-slate-500">
                    <BookOpen className="w-4 h-4 text-emerald-600 ml-1.5" />
                    <span>النوع: {activeWorksheet.type}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">التعليمات والتوجيهات:</span>
                  <p className="text-slate-700 leading-relaxed font-semibold">
                    {activeWorksheet.instructions}
                  </p>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-start space-x-2 space-x-reverse">
                <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5 ml-2" />
                <div>
                  <h5 className="text-xs font-extrabold text-sky-850">أوراق عمل معتمدة فسيولوجية</h5>
                  <p className="text-[10px] text-slate-650 leading-relaxed mt-1">
                    تلتزم أوراق العمل بصياغة نماذج أسئلة امتحانات الشهادة السودانية، مما يدرب الطالب على مهارات التفسير العلمي والمقارنة والتحليل العضلي والهرموني الدقيق.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-rose-700">المهام وأسئلة التحليل العلمي:</h4>
              </div>

              <div className="space-y-4">
                {activeWorksheet.tasks.map((task, idx) => {
                  const taskId = `${activeWorksheet.id}_t_${idx}`;
                  const isRevealed = !!revealedAnswers[taskId];

                  return (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-extrabold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 ml-3">
                          مهمة {idx + 1}
                        </span>
                        <h5 className="text-xs font-bold text-slate-800 leading-relaxed text-right flex-1">
                          {task.question}
                        </h5>
                      </div>

                      {task.hint && (
                        <p className="text-[11px] text-amber-700 bg-amber-50/50 p-2 rounded-lg border border-dashed border-amber-200/80 font-medium">
                          <span className="font-extrabold ml-1">تلميح علمي:</span>
                          {task.hint}
                        </p>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">مساحة صياغة الإجابة الشخصية:</label>
                        <textarea
                          rows={2}
                          placeholder="صغ إجابتك العلمية بالتفصيل قبل التحقق من الإجابة النموذجية..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-750 font-semibold focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 leading-relaxed text-right"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleToggleReveal(taskId)}
                          className={`flex items-center space-x-1.5 space-x-reverse py-1 px-3 rounded-lg font-bold text-[10px] transition-all border ${
                            isRevealed ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5 ml-1 text-rose-600" /> : <Eye className="w-3.5 h-3.5 ml-1 text-slate-400" />}
                          <span>{isRevealed ? 'إخفاء الإجابة النموذجية' : 'عرض الإجابة النموذجية للوزارة'}</span>
                        </button>
                      </div>

                      <AnimatePresence>
                        {isRevealed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-xs text-slate-800 leading-relaxed"
                          >
                            <div className="flex items-center space-x-1.5 space-x-reverse text-emerald-800 font-extrabold mb-1">
                              <Award className="w-4 h-4 ml-1 text-emerald-600" />
                              <span>الإجابة الفسيولوجية النموذجية المعتمدة:</span>
                            </div>
                            <p className="whitespace-pre-line text-[11px] text-slate-700 font-semibold">
                              {task.sampleAnswer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // SMART WORKSHEET AND EXAM GENERATOR WITH A4 WATERMARK + INTERACTIVE SOLVING
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Right/Top Column: Generator Settings Configuration */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <Settings className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-extrabold text-slate-800">تخصيص وإعداد ورقة الاختبار</h3>
              </div>

              {/* Range Scope Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 block">نطاق الأسئلة في ورقة العمل:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setScope('all')}
                    className={`py-2 px-3 text-center border text-[10px] font-bold rounded-xl transition-all ${
                      scope === 'all' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    كامل المنهج المقرر
                  </button>
                  <button
                    onClick={() => setScope('unit')}
                    className={`py-2 px-3 text-center border text-[10px] font-bold rounded-xl transition-all ${
                      scope === 'unit' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    وحدة دراسية محددة
                  </button>
                  <button
                    onClick={() => setScope('lesson')}
                    className={`py-2 px-3 text-center border text-[10px] font-bold rounded-xl transition-all ${
                      scope === 'lesson' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    درس فسيولوجي محدد
                  </button>
                  <button
                    onClick={() => setScope('favorites')}
                    className={`py-2 px-3 text-center border text-[10px] font-bold rounded-xl transition-all flex items-center justify-center space-x-1 space-x-reverse ${
                      scope === 'favorites' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Star className="w-3 h-3 text-amber-500 fill-current ml-1" />
                    <span>الدروس المفضلة</span>
                  </button>
                </div>
              </div>

              {/* Conditional dropdowns based on scope */}
              {scope === 'unit' && (
                <div className="space-y-1 animate-slideDown">
                  <label className="text-[10px] font-bold text-slate-500">اختر الوحدة الدراسية:</label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {CURRICULUM.map(u => (
                      <option key={u.id} value={u.id}>الوحدة {u.number}: {u.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {scope === 'lesson' && (
                <div className="space-y-2 animate-slideDown">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">اختر الوحدة الدراسية أولاً:</label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {CURRICULUM.map(u => (
                        <option key={u.id} value={u.id}>الوحدة {u.number}: {u.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">اختر الدرس الفسيولوجي:</label>
                    <select
                      value={selectedLessonId}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {currentUnitObj?.lessons.map(l => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Question Types checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 block">نوع الأسئلة المشمولة بالامتحان:</label>
                <div className="space-y-1.5">
                  {[
                    { key: 'true_false', label: 'أسئلة صح أو خطأ (✔ / ✘)' },
                    { key: 'fill_blank', label: 'أسئلة أكمل الفراغات بما يناسبها' },
                    { key: 'matching', label: 'أسئلة صل الكلمات والمصطلحات' },
                    { key: 'diagram', label: 'أسئلة إيضاح وتسمية الرسمة البيولوجية' }
                  ].map(t => (
                    <label key={t.key} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-150 cursor-pointer hover:bg-slate-100 transition-all">
                      <span className="text-xs font-semibold text-slate-700">{t.label}</span>
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(t.key)}
                        onChange={() => handleToggleType(t.key)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantity Slider up to 20 sheets */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{numSheets} ورقة</span>
                  <span>عدد الأوراق المطلوبة لتوليدها:</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={numSheets}
                  onChange={(e) => setNumSheets(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 mt-2 cursor-pointer"
                />
                <span className="text-[9px] text-slate-400 text-center block mt-1">يتم توزيع الأسئلة الفسيولوجية وتقسيمها لصفحات قياس A4</span>
              </div>

              {/* Re-generate trigger */}
              <button
                onClick={handleGenerateWorksheet}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-700/10 flex items-center justify-center space-x-2 space-x-reverse"
              >
                <RefreshCw className="w-4 h-4 ml-1 animate-spin-slow" />
                <span>تحديث وتوليد ورقة العمل</span>
              </button>
            </div>

            {/* Password Unlock Panel (Watermark removal) */}
            <div className="bg-gradient-to-br from-slate-50 to-amber-50/40 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-3xs">
              <div className="flex items-center justify-between">
                {isWatermarkRemoved ? (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center">
                    <Unlock className="w-3 h-3 ml-1" /> تم فك العلامة المائية
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center">
                    <Lock className="w-3 h-3 ml-1" /> العلامة المائية نشطة
                  </span>
                )}
                <h4 className="text-xs font-bold text-slate-700">ترخيص أوراق العمل</h4>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                تحتوي أوراق العمل على علامة مائية باسم <span className="font-bold text-rose-800">"نقلة للمناهج الالكترونية"</span>. يمكنك إزالة هذه العلامة المائية نهائياً عن طريق إدخال رمز الترخيص السري للنظام.
              </p>

              {!isWatermarkRemoved && (
                <div className="space-y-2">
                  {!showPasswordBox ? (
                    <button
                      onClick={() => setShowPasswordBox(true)}
                      className="text-[10px] text-emerald-700 font-extrabold hover:underline block"
                    >
                      هل تملك رمز فك الترخيص؟ انقر هنا لإدخاله.
                    </button>
                  ) : (
                    <form onSubmit={handleUnlockWatermark} className="flex gap-1.5 items-center">
                      <input
                        type="password"
                        placeholder="أدخل رمز فك العلامة المائية..."
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className={`flex-1 text-xs p-2 rounded-xl bg-white border ${passwordError ? 'border-rose-400' : 'border-slate-200'} focus:outline-none`}
                      />
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl transition-all"
                      >
                        فك القفل
                      </button>
                    </form>
                  )}
                  {passwordError && (
                    <p className="text-[9px] text-rose-600 font-bold">الرمز المدخل غير صحيح! يرجى المحاولة مجدداً.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Left/Bottom Column: Styled A4 Worksheet Area with watermarks */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Action buttons (Grade / Print) */}
            <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-2xl shadow-3xs">
              <span className="text-xs font-bold text-slate-500">
                الصفحة الحالية: <span className="font-mono text-emerald-600 font-extrabold">{currentPage + 1}</span> من <span className="font-mono">{numSheets}</span> أوراق
              </span>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={handleGradeWorksheet}
                  disabled={isGraded && Object.keys(userAnswers).length === 0}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold py-2 px-4 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse"
                >
                  <Award className="w-4 h-4 ml-1" />
                  <span>تصحيح الاختبار فورا ومراجعة الأداء</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse"
                >
                  <Printer className="w-4 h-4 ml-1" />
                  <span>طباعة ورقة العمل (A4)</span>
                </button>
              </div>
            </div>

            {/* Live interactive scorecard on top if graded */}
            {isGraded && (
              <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-5 rounded-2xl space-y-3 border border-rose-800 shadow-lg animate-fadeIn">
                <div className="flex justify-between items-center border-b border-rose-900 pb-2">
                  <span className="text-xs font-mono font-bold bg-rose-500 text-white py-0.5 px-2.5 rounded-full">
                    معدل الأداء: {getWorksheetScore().pct}%
                  </span>
                  <h4 className="text-sm font-black text-rose-400">بطاقة التقييم والتصحيح الفوري بالموقع</h4>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-bold text-slate-200">
                  <p>النقاط الإجمالية المكتسبة: <span className="text-emerald-400 font-mono text-sm">{getWorksheetScore().earned}</span> من <span className="font-mono">{getWorksheetScore().total}</span> درجة</p>
                  <p className="text-slate-350">
                    التقدير الفسيولوجي الممنوح:{' '}
                    <span className={`font-black text-sm px-2 py-0.5 rounded ${
                      getWorksheetScore().pct >= 85 ? 'text-emerald-400' : getWorksheetScore().pct >= 65 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {getWorksheetScore().pct >= 85 ? 'ممتاز (طبيب فسيولوجي)' : getWorksheetScore().pct >= 65 ? 'جيد جداً (تحصيل ممتاز)' : 'مقبول (يحتاج لمراجعة الدرس)'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* SIMULATED PHYSICAL A4 SHEET */}
            <div className="w-full bg-white border border-slate-300 shadow-xl rounded-sm p-6 md:p-10 relative overflow-hidden select-text flex flex-col justify-between shadow-slate-400/20" style={{ minHeight: '842px' }}>
              
              {/* DIAGONAL WATERMARK OVERLAY */}
              {!isWatermarkRemoved && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-[0.06] rotate-[-30deg] text-3xl md:text-5xl font-black text-rose-800 tracking-widest whitespace-nowrap">
                  نقلة للمناهج الالكترونية
                </div>
              )}

              {/* A4 Document Header */}
              <div className="border-b-2 border-double border-slate-400 pb-4 mb-6 relative z-20">
                <div className="flex justify-between items-start text-[10px] font-extrabold text-slate-700">
                  <div className="text-left space-y-0.5">
                    <p>المادة: الأحياء الفسيولوجية</p>
                    <p>الصف: الثالث الثانوي (الشهادة)</p>
                    <p>التاريخ: {new Date().toLocaleDateString('ar-SD')}</p>
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-black text-slate-800 tracking-wide">المنهج الفسيولوجي الموحد - السودان</h3>
                    <p className="text-[9px] text-slate-500 font-medium">مُطوّر بواسطة منصة نقلة التعليمية</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p>المعلم: منشئ الامتحان الذكي</p>
                    <p>رقم ورقة العمل: {currentPage + 1}</p>
                    <p className="text-rose-700 font-bold">علامة مائية: {isWatermarkRemoved ? 'ملغي' : 'نشط'}</p>
                  </div>
                </div>

                {/* Student fillable name line */}
                <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-200 pt-2 text-[10px] font-bold text-slate-600">
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <span>اسم الطالب:</span>
                    <input
                      type="text"
                      placeholder="........................................................................"
                      className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold flex-1 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <span>المدرسة:</span>
                    <input
                      type="text"
                      placeholder="........................................................................"
                      className="bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold flex-1 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Questions Render Section */}
              <div className="space-y-8 flex-1 relative z-20">
                {activePageQuestions.map((q, idx) => {
                  const globalIdx = startIndex + idx;
                  const uAnswer = userAnswers[q.id];

                  return (
                    <div key={q.id} className="space-y-3 pb-6 border-b border-dashed border-slate-200 last:border-0">
                      
                      {/* Question label & score */}
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-50 border border-slate-200 py-0.5 px-2 rounded">
                          ({q.points} درجات)
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-850 leading-relaxed text-right flex-1">
                          س {globalIdx + 1}: {q.questionText}
                        </h4>
                      </div>

                      {/* Question Answer Panel */}
                      <div className="mt-2 text-right pr-2">
                        {/* 1. True or False Choice */}
                        {q.type === 'true_false' && (
                          <div className="flex space-x-3 space-x-reverse justify-end">
                            {['صح', 'خطأ'].map(val => {
                              const isSelected = uAnswer === val;
                              return (
                                <button
                                  key={val}
                                  onClick={() => {
                                    if (isGraded) return;
                                    setUserAnswers(prev => ({ ...prev, [q.id]: val }));
                                  }}
                                  disabled={isGraded}
                                  className={`px-6 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                    isSelected
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-3xs'
                                      : 'bg-white border-slate-250 hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* 2. Fill in the Blank Input */}
                        {q.type === 'fill_blank' && (
                          <div className="flex justify-end items-center space-x-2 space-x-reverse max-w-sm ml-auto">
                            <span className="text-[11px] text-slate-450">الإجابة:</span>
                            <input
                              type="text"
                              value={uAnswer || ''}
                              onChange={(e) => {
                                if (isGraded) return;
                                setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                              }}
                              disabled={isGraded}
                              placeholder="اكتب الإجابة باللغة العربية الفصحى..."
                              className="flex-1 text-xs p-2 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 text-slate-800 font-bold focus:outline-none focus:border-rose-600 text-right focus:ring-1 focus:ring-rose-600"
                            />
                          </div>
                        )}

                        {/* 3. Matching Right items to Left dropdown selectors */}
                        {q.type === 'matching' && q.matchingLeft && (
                          <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-150 max-w-xl ml-auto">
                            <span className="text-[9px] font-bold text-slate-400 block mb-1">حدد الاختيار المناسب من العمود المقابل لكل مصطلح:</span>
                            {q.matchingLeft.map((leftItem) => {
                              const currentSelected = uAnswer?.[leftItem] || '';
                              return (
                                <div key={leftItem} className="flex justify-between items-center text-xs gap-3">
                                  <select
                                    value={currentSelected}
                                    disabled={isGraded}
                                    onChange={(e) => {
                                      if (isGraded) return;
                                      const leftAnswers = uAnswer || {};
                                      setUserAnswers(prev => ({
                                        ...prev,
                                        [q.id]: { ...leftAnswers, [leftItem]: e.target.value }
                                      }));
                                    }}
                                    className="flex-1 text-[11px] font-bold p-1 bg-white border border-slate-200 rounded-lg text-right"
                                  >
                                    <option value="">-- اختر المطابق المناسب --</option>
                                    {q.matchingRight?.map(rightItem => (
                                      <option key={rightItem} value={rightItem}>{rightItem}</option>
                                    ))}
                                  </select>
                                  <span className="font-bold text-slate-700 min-w-[120px] text-left">{leftItem}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* 4. Biological Diagram Labeling */}
                        {q.type === 'diagram' && q.diagramLabels && (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            {/* Visual Vector Map based on diagramId */}
                            <div className="md:col-span-6 bg-slate-50 rounded-xl border border-slate-150 p-2 flex justify-center items-center">
                              {q.diagramId === 'chloroplast' && (
                                <svg viewBox="0 0 320 180" className="w-full max-w-[240px]">
                                  <ellipse cx="160" cy="90" rx="140" ry="75" fill="none" stroke="#047857" strokeWidth="2.5" />
                                  <ellipse cx="160" cy="90" rx="130" ry="67" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="3,3" />
                                  <g transform="translate(80, 70)">
                                    <rect x="0" y="0" width="28" height="6" rx="1" fill="#10b981" />
                                    <rect x="0" y="8" width="28" height="6" rx="1" fill="#10b981" />
                                    <rect x="0" y="16" width="28" height="6" rx="1" fill="#10b981" />
                                  </g>
                                  <g transform="translate(180, 80)">
                                    <rect x="0" y="0" width="28" height="6" rx="1" fill="#10b981" />
                                    <rect x="0" y="8" width="28" height="6" rx="1" fill="#10b981" />
                                  </g>
                                  <circle cx="35" cy="90" r="10" fill="#3b82f6" />
                                  <text x="35" y="93.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">1</text>
                                  <circle cx="65" cy="45" r="10" fill="#3b82f6" />
                                  <text x="65" y="48.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">2</text>
                                  <circle cx="94" cy="115" r="10" fill="#3b82f6" />
                                  <text x="94" y="118.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">3</text>
                                  <circle cx="160" cy="55" r="10" fill="#3b82f6" />
                                  <text x="160" y="58.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">4</text>
                                </svg>
                              )}
                              {q.diagramId === 'heart' && (
                                <svg viewBox="0 0 320 180" className="w-full max-w-[240px]">
                                  <path d="M 160 160 C 100 135 60 110 75 75 C 82 52 105 37 130 52 C 141 60 160 70 160 70 C 160 70 179 60 190 52 C 215 37 238 52 245 75 C 260 110 220 135 160 160 Z" fill="#fca5a5" stroke="#dc2626" strokeWidth="2" />
                                  <path d="M 160 70 L 160 158" stroke="#991b1b" strokeWidth="2.5" />
                                  <ellipse cx="115" cy="70" rx="18" ry="12" fill="#fee2e2" stroke="#dc2626" strokeWidth="1" />
                                  <ellipse cx="205" cy="70" rx="18" ry="12" fill="#fee2e2" stroke="#dc2626" strokeWidth="1" />
                                  <circle cx="160" cy="20" r="10" fill="#3b82f6" />
                                  <text x="160" y="23.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">1</text>
                                  <circle cx="115" cy="70" r="10" fill="#3b82f6" />
                                  <text x="115" y="73.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">2</text>
                                  <circle cx="205" cy="70" r="10" fill="#3b82f6" />
                                  <text x="205" y="73.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">3</text>
                                  <circle cx="120" cy="115" r="10" fill="#3b82f6" />
                                  <text x="120" y="118.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">4</text>
                                  <circle cx="200" cy="115" r="10" fill="#3b82f6" />
                                  <text x="200" y="118.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">5</text>
                                </svg>
                              )}
                              {q.diagramId === 'nephron' && (
                                <svg viewBox="0 0 320 180" className="w-full max-w-[240px]">
                                  <path d="M 80 60 A 18 18 0 1 1 80 95" fill="none" stroke="#d97706" strokeWidth="3" />
                                  <path d="M 68 78 Q 80 92 68 85" fill="none" stroke="#ef4444" strokeWidth="2" />
                                  <path d="M 98 78 Q 120 50 140 75 T 160 82" fill="none" stroke="#f59e0b" strokeWidth="3" />
                                  <path d="M 160 82 L 160 140 A 8 8 0 0 0 176 140 L 176 82" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                                  <line x1="220" y1="40" x2="220" y2="150" stroke="#b45309" strokeWidth="3.5" />
                                  <circle cx="68" cy="78" r="10" fill="#3b82f6" />
                                  <text x="68" y="81.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">1</text>
                                  <circle cx="120" cy="60" r="10" fill="#3b82f6" />
                                  <text x="120" y="63.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">2</text>
                                  <circle cx="168" cy="140" r="10" fill="#3b82f6" />
                                  <text x="168" y="143.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">3</text>
                                  <circle cx="232" cy="80" r="10" fill="#3b82f6" />
                                  <text x="232" y="83.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">4</text>
                                </svg>
                              )}
                            </div>

                            {/* Dropdown lists representing matching keys */}
                            <div className="md:col-span-6 space-y-2">
                              {q.diagramLabels.map((lbl) => {
                                const currentLblSelected = uAnswer?.[lbl.num] || '';
                                return (
                                  <div key={lbl.num} className="flex justify-between items-center text-xs gap-2">
                                    <select
                                      value={currentLblSelected}
                                      disabled={isGraded}
                                      onChange={(e) => {
                                        if (isGraded) return;
                                        const labelsAnswers = uAnswer || {};
                                        setUserAnswers(prev => ({
                                          ...prev,
                                          [q.id]: { ...labelsAnswers, [lbl.num]: e.target.value }
                                        }));
                                      }}
                                      className="flex-1 text-[11px] font-bold p-1 bg-white border border-slate-200 rounded-lg text-right"
                                    >
                                      <option value="">-- حدد المسمى المناسب --</option>
                                      {lbl.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                    <span className="font-bold text-slate-600 bg-slate-100 py-0.5 px-2.5 rounded-full font-mono">
                                      رقم {lbl.num}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Interactive grading evaluation */}
                      {isGraded && (
                        <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200 animate-fadeIn space-y-2 text-xs">
                          {/* Correctness banner */}
                          {(() => {
                            let isCorrect = false;
                            if (q.type === 'true_false' && uAnswer === q.correctAnswer) isCorrect = true;
                            if (q.type === 'fill_blank' && uAnswer?.trim() === q.correctAnswer) isCorrect = true;
                            if (q.type === 'matching' && uAnswer) {
                              isCorrect = true;
                              q.matchingLeft?.forEach(l => {
                                if (uAnswer[l] !== q.matchingCorrectMap?.[l]) isCorrect = false;
                              });
                            }
                            if (q.type === 'diagram' && uAnswer) {
                              isCorrect = true;
                              q.diagramLabels?.forEach(l => {
                                if (uAnswer[l.num] !== l.label) isCorrect = false;
                              });
                            }

                            return (
                              <div className="flex items-center space-x-2 space-x-reverse">
                                {isCorrect ? (
                                  <span className="text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg font-black flex items-center">
                                    <Check className="w-3.5 h-3.5 ml-1 text-emerald-600" /> إجابة صحيحة وممتازة
                                  </span>
                                ) : (
                                  <span className="text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg font-black flex items-center">
                                    <X className="w-3.5 h-3.5 ml-1 text-rose-600" /> إجابة غير دقيقة
                                  </span>
                                )}
                                <span className="text-slate-500 font-medium">الجواب النموذجي المنهجي: <span className="font-bold text-slate-800">{q.type === 'true_false' || q.type === 'fill_blank' ? q.correctAnswer : 'راجع التفسير'}</span></span>
                              </div>
                            );
                          })()}

                          {/* Explanation */}
                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-150 leading-relaxed">
                            <span className="font-extrabold text-emerald-800 ml-1">التعليل العلمي للمنهج:</span>
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* A4 Document Footer */}
              <div className="border-t border-slate-200 pt-3 mt-6 flex justify-between items-center text-[10px] font-bold text-slate-500 relative z-20">
                <p>جميع الحقوق محفوظة © منصة نقلة للمناهج الإلكترونية 2026</p>
                <p className="font-mono">صفحة {currentPage + 1} من {numSheets}</p>
                <p>جمهورية السودان - وزارة التربية والتعليم</p>
              </div>
            </div>

            {/* Paging Actions */}
            {numSheets > 1 && (
              <div className="flex justify-center items-center space-x-3 space-x-reverse bg-white p-3 border border-slate-200 rounded-2xl shadow-3xs">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all text-xs font-bold flex items-center"
                >
                  <ChevronRight className="w-4 h-4 ml-1" />
                  <span>الورقة السابقة</span>
                </button>
                <span className="text-xs font-bold text-slate-600">
                  الورقة <span className="font-mono text-emerald-600 font-extrabold">{currentPage + 1}</span> من <span className="font-mono">{numSheets}</span>
                </span>
                <button
                  disabled={currentPage === numSheets - 1}
                  onClick={() => setCurrentPage(prev => Math.min(numSheets - 1, prev + 1))}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all text-xs font-bold flex items-center"
                >
                  <span>الورقة التالية</span>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
