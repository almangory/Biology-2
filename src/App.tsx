/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { StudentProgress, SpacedReminder } from './types';
import Dashboard from './components/Dashboard';
import LessonViewer from './components/LessonViewer';
import VirtualLab from './components/VirtualLab';
import WorksheetsSection from './components/WorksheetsSection';
import ExamsSection from './components/ExamsSection';
import ReviewReminders from './components/ReviewReminders';
import SmartResearcher from './components/SmartResearcher';
import BiologyGlossary from './components/BiologyGlossary';
import StudentAssistantBot from './components/StudentAssistantBot';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, BookOpen, Beaker, FileText, ClipboardCheck, 
  Activity, GraduationCap, Eye, EyeOff, Search, Sun, Moon, Book
} from 'lucide-react';
import { performCurriculumSearch, SearchResult } from './utils/search';
import { CURRICULUM } from './data/curriculum';

export default function App() {
  const [activeTab, setActiveTab] = useState('lessons');
  const [preselectedLabId, setPreselectedLabId] = useState<string | undefined>(undefined);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('sudan_biology_dark') === 'true');

  useEffect(() => {
    localStorage.setItem('sudan_biology_dark', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Custom navigation targets for selected lesson/unit
  const [currentUnitId, setCurrentUnitId] = useState<string | undefined>(undefined);
  const [currentLessonId, setCurrentLessonId] = useState<string | undefined>(undefined);
  
  // Sub-modes for the 3 simplified Tracks
  const [learningMode, setLearningMode] = useState<'theory' | 'lab'>('theory');
  const [evaluationMode, setEvaluationMode] = useState<'exams' | 'worksheets'>('exams');
  const [adminMode, setAdminMode] = useState<'dashboard' | 'reminders' | 'researcher'>('dashboard');

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Core Student Analytics State
  const [progress, setProgress] = useState<StudentProgress>({
    completedLessonIds: [],
    bookmarkedLessonIds: [],
    bookmarkedUnitIds: [], 
    bookmarkedLabIds: [], 
    quizScores: {},
    unitScores: {},
    timeSpentMinutes: 0,
    weaknesses: [],
    strengths: []
  });

  // Spaced repetition scheduled reminders state
  const [reminders, setReminders] = useState<SpacedReminder[]>([]);

  // Toast Notification alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.history.pushState({ tab: tabId }, '');
  };

  const handleNavigateToLab = (labId: string) => {
    setPreselectedLabId(labId);
    setLearningMode('lab');
    handleTabChange('lessons');
  };

  // Sync Progress state to localStorage automatically on update
  useEffect(() => {
    if (progress.timeSpentMinutes > 0 || progress.completedLessonIds.length > 0) {
      localStorage.setItem('sudan_biology_progress', JSON.stringify(progress));
    }
  }, [progress]);

  // Sync Reminders state to localStorage automatically on update
  useEffect(() => {
    if (reminders.length > 0) {
      localStorage.setItem('sudan_biology_reminders', JSON.stringify(reminders));
    }
  }, [reminders]);

  // Intercept back button for tabs
  useEffect(() => {
    window.history.replaceState({ tab: 'lessons' }, '');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        setActiveTab('lessons');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intercept exit/reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'هل أنت متأكد من رغبتك في مغادرة التطبيق؟';
      return 'هل أنت متأكد من رغبتك في مغادرة التطبيق؟';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Close search results dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load initial data from localStorage if exists
  useEffect(() => {
    const savedProgress = localStorage.getItem('sudan_biology_progress');
    const savedReminders = localStorage.getItem('sudan_biology_reminders');
    if (savedProgress) {
      try { setProgress(JSON.parse(savedProgress)); } catch (e) { console.error(e); }
    }
    if (savedReminders) {
      try { setReminders(JSON.parse(savedReminders)); } catch (e) { console.error(e); }
    }
  }, []);

  // Add a new Spaced study reminder using functional state update
  const handleAddReminder = (lessonId: string, lessonTitle: string, unitTitle: string, days: number) => {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + days);

    const newReminder: SpacedReminder = {
      id: `rem_${Date.now()}_${lessonId}`,
      lessonId,
      lessonTitle,
      unitTitle,
      scheduledTime: scheduledDate.toISOString(),
      intervalDays: days,
      status: 'pending'
    };

    setReminders(prev => [...prev, newReminder]);
    triggerToast(`تمت جدولة مراجعة درس [ ${lessonTitle} ] بعد ${days} أيام بنجاح.`);
  };

  // Remove a reminder using functional state update
  const handleRemoveReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    triggerToast('تم حذف تذكير المراجعة المختار.');
  };

  // Mark lesson reviewed using functional state update
  const handleMarkReviewed = (reminderId: string) => {
    setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: 'reviewed' as const } : r));
    triggerToast('أحسنت! تم تسجيل إتمام جلسة المراجعة وتثبيت الحفظ.');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle live search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      const filtered = performCurriculumSearch(query);
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Navigate directly when a search result is clicked
  const handleSearchResultClick = (result: SearchResult) => {
    setSearchQuery('');
    setShowSearchResults(false);
    
    if (result.type === 'lesson') {
      setCurrentUnitId(result.unitId);
      setCurrentLessonId(result.lessonId);
      setLearningMode('theory');
      handleTabChange('lessons');
      triggerToast(`جاري فتح درس: ${result.title}`);
    } else if (result.type === 'lab') {
      setPreselectedLabId(result.id);
      setLearningMode('lab');
      handleTabChange('lessons');
      triggerToast(`جاري فتح معمل: ${result.title}`);
    } else if (result.type === 'exam_question') {
      setEvaluationMode('exams');
      handleTabChange('exams');
      triggerToast(`جاري الانتقال إلى الامتحانات: ${result.title.substring(0, 30)}...`);
    }
  };

  return (
    // الخلفية أصبحت عاجية دافئة مريحة جداً ومقاومة لإجهاد العين وتدعم المظهر الليلي الفاخر
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-[#121210] text-[#e5dfd5]' 
        : isFocusMode 
          ? 'bg-[#fdfbf7] text-[#2d2219]' 
          : 'bg-[#fcfaf4] text-[#3c2f24]'
    } flex flex-col font-sans select-none transition-colors duration-300`} id="sudan-biology-app">
      {/* التنبيهات المنبثقة بلون التراكوتا الفخاري */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 15, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${isDarkMode ? 'bg-[#df7a5c] border-[#f19277]' : 'bg-[#c86446] border-[#b05237]'} text-white py-3 px-6 rounded-2xl shadow-xl text-xs font-bold leading-normal text-right flex items-center space-x-2 space-x-reverse border max-w-sm md:max-w-md`}
            id="toast-notification"
          >
            <Activity className="w-4 h-4 text-[#f6f1e5] shrink-0 ml-1.5 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* شريط الرأس المعزز بلمسات ترابية عصرية متناسقة مع صورة image_150641.jpg وتدعم المظهر الداكن */}
      {!isFocusMode && (
        <header className={`border-b ${isDarkMode ? 'border-[#2e2e2a] bg-[#1a1a17]/95' : 'border-[#eaddca] bg-white/95'} backdrop-blur sticky top-0 z-40 shadow-3xs transition-colors duration-300`} id="app-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* اليسار: وضع التركيز بستايل دافئ وجذاب مع زر المظهر الليلي */}
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={() => {
                  setIsFocusMode(true);
                  triggerToast('تم تفعيل وضع التركيز الهادئ لتقليل التشتيت. دراسة ممتعة!');
                }}
                className={`flex items-center space-x-1.5 space-x-reverse ${
                  isDarkMode 
                    ? 'bg-[#292924] hover:bg-[#33332d] text-[#df7a5c] border-[#3a3a35]' 
                    : 'bg-[#f6f1e5] hover:bg-[#ebdcb9] text-[#c86446] border-[#eaddca]'
                } py-2 px-3.5 rounded-xl text-xs font-bold transition-all shadow-3xs border`}
                title="تفعيل نمط الدراسة بلا مشتتات"
              >
                <Eye className={`w-4 h-4 ${isDarkMode ? 'text-[#df7a5c]' : 'text-[#c86446]'} ml-1.5`} />
                <span>وضع التركيز 🧘</span>
              </button>

              {/* زر تبديل المظهر الليلي والنهاري */}
              <button
                onClick={() => {
                  setIsDarkMode(!isDarkMode);
                  triggerToast(!isDarkMode ? 'تم تفعيل المظهر الليلي المريح للعين 🌙' : 'تم تفعيل المظهر المضيء ☀️');
                }}
                className={`flex items-center space-x-1.5 space-x-reverse py-2 px-3.5 rounded-xl text-xs font-bold transition-all shadow-3xs border ${
                  isDarkMode 
                    ? 'bg-[#292924] hover:bg-[#33332d] text-amber-400 border-[#3a3a35]' 
                    : 'bg-[#f6f1e5] hover:bg-[#ebdcb9] text-indigo-900 border-[#eaddca]'
                }`}
                title="تبديل المظهر الليلي والنهاري"
              >
                {isDarkMode ? <Sun className="w-4 h-4 ml-1" /> : <Moon className="w-4 h-4 ml-1" />}
                <span className="hidden sm:inline">{isDarkMode ? 'المظهر المضيء ☀️' : 'المظهر الليلي 🌙'}</span>
              </button>

              <div className={`hidden md:flex items-center space-x-1 space-x-reverse text-[10px] ${isDarkMode ? 'text-[#baa896] bg-[#292924]' : 'text-[#7c6a59] bg-[#f6f1e5]'} px-2.5 py-1 rounded-lg`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#459b6d]' : 'bg-[#1e4631]'} animate-pulse`}></span>
                <span>بيئة دراسة ذكية منظمة</span>
              </div>
            </div>

            {/* المنتصف: صندوق البحث الفوري المعدل ليدعم المظهر الليلي */}
            <div className="flex-1 max-w-md mx-6 relative" ref={searchContainerRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن درس، تجربة معملية، أو مصطلح علمي... 🔍"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => { if (searchQuery.trim().length >= 2) setShowSearchResults(true); }}
                  className={`w-full ${
                    isDarkMode 
                      ? 'bg-[#21211e] border-[#3a3a35] text-white placeholder-[#7c6a59] focus:bg-[#2a2a26] focus:border-[#459b6d]' 
                      : 'bg-[#f6f1e5]/60 border-[#eaddca] text-[#2d2219] placeholder-[#a6937c] focus:bg-white focus:border-[#1e4631]'
                  } rounded-2xl py-2 pl-4 pr-10 text-xs font-bold text-right focus:outline-none focus:ring-1 focus:ring-emerald-500/10 shadow-3xs transition-all`}
                />
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a6937c] pointer-events-none" />
              </div>

              {/* قائمة نتائج البحث الفورية المنسجمة بلمسات ترابية وتدعم المظهر الليلي */}
              <AnimatePresence>
                {showSearchResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute top-full left-0 right-0 mt-2 ${
                      isDarkMode ? 'bg-[#1a1a17]/95 border-[#2e2e2a]' : 'bg-white/95'
                    } backdrop-blur-md border border-[#eaddca] rounded-2xl shadow-2xl z-50 max-h-[380px] overflow-y-auto p-2 text-right`}
                  >
                    <div className={`p-2 border-b ${isDarkMode ? 'border-[#292924]' : 'border-[#f6f1e5]'} flex justify-between items-center`}>
                      <span className="text-[9px] font-bold text-[#a6937c] font-mono">بحث فوري فائق الدقة ({searchResults.length})</span>
                      <span className={`text-[10px] font-black ${isDarkMode ? 'text-[#459b6d]' : 'text-[#1e4631]'}`}>نتائج البحث العلمي للطلاب</span>
                    </div>

                    <div className="space-y-1 py-1">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSearchResultClick(result)}
                          className={`w-full text-right p-3 rounded-xl ${
                            isDarkMode ? 'hover:bg-[#22221e] hover:border-[#2e2e2a]' : 'hover:bg-[#fcfaf4] hover:border-[#f6f1e5]'
                          } border border-transparent flex items-start space-x-3 space-x-reverse transition-all`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${
                            result.type === 'lesson' 
                              ? isDarkMode ? 'bg-[#292924] text-[#459b6d]' : 'bg-[#f6f1e5] text-[#1e4631]' 
                              : result.type === 'lab' 
                                ? 'bg-indigo-50/20 text-indigo-400' 
                                : 'bg-rose-50/20 text-rose-400'
                          }`}>
                            {result.type === 'lesson' && <BookOpen className="w-4 h-4" />}
                            {result.type === 'lab' && <Beaker className="w-4 h-4" />}
                            {result.type === 'exam_question' && <ClipboardCheck className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex justify-between items-baseline">
                              <span className="text-[9px] font-bold text-[#a6937c]">{result.subtitle}</span>
                              <h4 className={`text-xs font-extrabold ${isDarkMode ? 'text-white' : 'text-[#2d2219]'} truncate`}>{result.title}</h4>
                            </div>
                            <p className={`text-[10px] ${isDarkMode ? 'text-[#baa896]' : 'text-[#7c6a59]'} font-medium leading-relaxed truncate`} dangerouslySetInnerHTML={{__html: result.snippet}} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {showSearchResults && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute top-full left-0 right-0 mt-2 ${
                      isDarkMode ? 'bg-[#1a1a17] border-[#2e2e2a]' : 'bg-white border-[#eaddca]'
                    } rounded-2xl shadow-xl z-50 p-6 text-center text-xs text-[#7c6a59] font-bold`}
                  >
                    <p>عذراً، لم نجد أي مصطلحات مطابقة للبحث داخل المنهج المرفق.</p>
                    <p className="text-[10px] text-[#a6937c] mt-1 font-medium">جرب البحث بكلمة أخرى مثل (البناء الضوئي، الكلية، الهضم، النيفرون).</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* اليمين: هويتنا الأكاديمية الجديدة */}
            <div className="flex items-center space-x-2.5 space-x-reverse">
              <div className={`p-2 rounded-xl border ${
                isDarkMode ? 'bg-[#292924] border-[#3a3a35] text-[#459b6d]' : 'bg-[#f6f1e5] border-[#ebdcb9] text-[#1e4631]'
              }`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h1 className={`text-xs sm:text-sm font-extrabold ${isDarkMode ? 'text-white' : 'text-[#2d2219]'} tracking-wide`}>المنهج التفاعلي لعلم الأحياء</h1>
                <span className={`text-[9px] sm:text-[10px] font-bold ${isDarkMode ? 'text-[#df7a5c]' : 'text-[#c86446]/90'} block`}>الصف الثاني الثانوي - جمهورية السودان</span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* منطقة العرض والتوزيع الأساسية المحدثة بالكامل */}
      <div className={`flex-1 w-full max-w-7xl mx-auto px-4 py-4 sm:py-6 flex flex-col ${isFocusMode ? '' : 'lg:flex-row-reverse gap-6'}`} id="app-main-content">
        
        {/* شريط التنقل الجانبي (المسارات الثلاثة) بكتل لونية ترابية متوازنة ومريحة */}
        {!isFocusMode && (
          <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col space-y-4" id="app-sidebar-nav">
            <div className={`${isDarkMode ? 'bg-[#1a1a17] border-[#2e2e2a]' : 'bg-white border-[#eaddca]'} rounded-2xl p-4 space-y-3 shadow-3xs`}>
              <div className={`hidden lg:block border-b ${isDarkMode ? 'border-[#292924]' : 'border-[#f6f1e5]'} pb-2.5 text-right`}>
                <span className="text-[9px] font-bold text-[#a6937c] block uppercase">التنقل الأكاديمي المبسط</span>
                <h3 className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-[#2d2219]'}`}>المسارات التعليمية</h3>
              </div>

              <nav className="flex flex-col gap-2 sm:grid sm:grid-cols-3 lg:flex lg:flex-col" id="navigation-tabs">
                {/* PILAR 1: مساحة التعلم والعمل العميق */}
                <button
                  onClick={() => {
                    setLearningMode('theory');
                    handleTabChange('lessons');
                  }}
                  className={`flex items-center justify-between py-3 px-3.5 rounded-xl text-xs font-black transition-all text-right ${
                    activeTab === 'lessons'
                      ? isDarkMode 
                        ? 'bg-[#292924] text-[#459b6d] border border-[#3a3a35] shadow-3xs' 
                        : 'bg-[#f6f1e5] text-[#1e4631] border border-[#ebdcb9] shadow-3xs'
                      : isDarkMode 
                        ? 'text-[#baa896] hover:text-white hover:bg-[#22221e]' 
                        : 'text-[#7c6a59] hover:text-[#2d2219] hover:bg-[#fcfaf4]'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${isDarkMode ? 'text-[#459b6d]' : 'text-[#1e4631]'} shrink-0`} />
                  <div className="flex-1 mr-2">
                    <span className="block">مساحة التعلم</span>
                    <span className="text-[9px] text-[#a6937c] font-bold block">الدروس والمعمل المندمج</span>
                  </div>
                </button>

                {/* PILAR 2: التقييم والتمكين */}
                <button
                  onClick={() => {
                    setEvaluationMode('exams');
                    handleTabChange('exams');
                  }}
                  className={`flex items-center justify-between py-3 px-3.5 rounded-xl text-xs font-black transition-all text-right ${
                    activeTab === 'exams'
                      ? isDarkMode 
                        ? 'bg-[#33221e] text-[#df7a5c] border border-[#442c26] shadow-3xs' 
                        : 'bg-[#ebdcb9]/30 text-[#c86446] border border-[#ebdcb9] shadow-3xs'
                      : isDarkMode 
                        ? 'text-[#baa896] hover:text-white hover:bg-[#22221e]' 
                        : 'text-[#7c6a59] hover:text-[#2d2219] hover:bg-[#fcfaf4]'
                  }`}
                >
                  <ClipboardCheck className={`w-4 h-4 ${isDarkMode ? 'text-[#df7a5c]' : 'text-[#c86446]'} shrink-0`} />
                  <div className="flex-1 mr-2">
                    <span className="block">التقييم الشامل</span>
                    <span className="text-[9px] text-[#a6937c] font-bold block">الامتحانات والتدريب</span>
                  </div>
                </button>

                {/* PILAR 3: القاموس التفاعلي للمصطلحات */}
                <button
                  onClick={() => {
                    handleTabChange('glossary');
                  }}
                  className={`flex items-center justify-between py-3 px-3.5 rounded-xl text-xs font-black transition-all text-right ${
                    activeTab === 'glossary'
                      ? isDarkMode 
                        ? 'bg-[#212733] text-amber-400 border border-[#2e3747] shadow-3xs' 
                        : 'bg-[#ebdcb9]/30 text-amber-900 border border-[#ebdcb9] shadow-3xs'
                      : isDarkMode 
                        ? 'text-[#baa896] hover:text-white hover:bg-[#22221e]' 
                        : 'text-[#7c6a59] hover:text-[#2d2219] hover:bg-[#fcfaf4]'
                  }`}
                >
                  <Book className={`w-4 h-4 ${isDarkMode ? 'text-amber-400' : 'text-[#c86446]'} shrink-0`} />
                  <div className="flex-1 mr-2">
                    <span className="block">القاموس التفاعلي</span>
                    <span className="text-[9px] text-[#a6937c] font-bold block">أطلس المصطلحات</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* مؤشر التقدم الجانبي المتناسق */}
            <div className={`hidden lg:block ${isDarkMode ? 'bg-[#1a1a17] border-[#2e2e2a]' : 'bg-white border-[#eaddca]'} rounded-2xl p-4 space-y-3.5 shadow-3xs text-right`}>
              <span className="text-[10px] font-bold text-[#a6937c] block uppercase">تقدم المنهج الأكاديمي</span>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className={`${isDarkMode ? 'text-[#459b6d]' : 'text-[#1e4631]'} font-mono`}>%{progress.completedLessonIds.length > 0 ? Math.round((progress.completedLessonIds.length / 13) * 100) : 0}</span>
                  <span className={`${isDarkMode ? 'text-[#baa896]' : 'text-[#7c6a59]'}`}>اكتمال الدروس</span>
                </div>
                <div className={`w-full h-1.5 ${isDarkMode ? 'bg-[#292924]' : 'bg-[#f6f1e5]'} rounded-full overflow-hidden`}>
                  <div 
                    className={`h-full ${isDarkMode ? 'bg-[#459b6d]' : 'bg-[#1e4631]'} rounded-full transition-all duration-500`} 
                    style={{ width: `${progress.completedLessonIds.length > 0 ? Math.round((progress.completedLessonIds.length / 13) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* نصيحة اليوم الأكاديمية */}
              <div className={`rounded-xl p-3 border ${isDarkMode ? 'bg-[#21211e] border-[#2e2e2a]' : 'bg-[#fdfbf7] border-[#eaddca]'}`}>
                <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-[#baa896]' : 'text-[#7c6a59]'} font-medium`}>
                  💡 <strong>نصيحة اليوم للتعلم العميق:</strong>
                  الدراسة والتركيز لمدة 35 دقيقة متبوعة بـ 5 دقائق استراحة هادئة تزيد من تجميع الأنسجة والمفاهيم فسيولوجياً وتثبيت الحفظ تلقائياً.
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* مساحة رندر وتوليد المحتوى الرئيسي */}
        <div className={`flex-1 min-w-0 ${isFocusMode ? 'max-w-4xl mx-auto w-full animate-fadeIn' : 'space-y-6'}`} id="tab-content-render-area">
          
          {/* بانر وضع التركيز الدافئ والمريح للقرنية */}
          {isFocusMode && (
            <div className={`border ${
              isDarkMode ? 'bg-[#21211e] border-[#3a3a35]' : 'bg-[#f6f1e5] border-[#eaddca]'
            } p-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-right shadow-3xs shrink-0 animate-fadeIn`}>
              <button
                onClick={() => {
                  setIsFocusMode(false);
                  triggerToast('تم الخروج من وضع التركيز بنجاح.');
                }}
                className={`flex items-center space-x-1.5 space-x-reverse ${
                  isDarkMode ? 'bg-[#df7a5c] hover:bg-[#c86446]' : 'bg-[#c86446] hover:bg-[#b05237]'
                } text-white py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-md shrink-0`}
              >
                <EyeOff className="w-4 h-4 ml-1.5" />
                <span>إيقاف وضع التركيز</span>
              </button>
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="text-right">
                  <span className={`text-[10px] font-bold ${
                    isDarkMode ? 'text-[#459b6d] bg-[#292924]' : 'text-[#1e4631] bg-[#ebdcb9]'
                  } px-2.5 py-0.5 rounded-full inline-block border ${isDarkMode ? 'border-[#3a3a35]' : 'border-[#eaddca]'} mb-0.5`}>
                    وضع التركيز والدراسة الهادئة نَشِط 🧘
                  </span>
                  <p className={`text-xs ${isDarkMode ? 'text-[#baa896]' : 'text-[#7c6a59]'} font-medium`}>تم إخفاء القوائم والإشعارات لتستمتع بتحصيل دراسي بلا مشتتات بصرية وبأعلى درجات الراحة البصرية.</p>
                </div>
              </div>
            </div>
          )}

          {/* ترويسة القسم النشط في الواجهة العادية */}
          {!isFocusMode && (
            <div className={`border ${
              isDarkMode ? 'bg-[#1a1a17] border-[#2e2e2a]' : 'bg-white border-[#eaddca]'
            } rounded-2xl p-4 flex items-center justify-between text-right shadow-3xs`}>
              <div className={`text-[10px] font-bold ${
                isDarkMode ? 'text-[#baa896] bg-[#292924] border-[#2e2e2a]' : 'text-[#a6937c] bg-[#fcfaf4] border-[#eaddca]'
              } px-2.5 py-1 rounded-lg border`}>
                {activeTab === 'dashboard' && 'الإدارة والتشخيص المستمر'}
                {activeTab === 'lessons' && 'مساحة التعلم الذاتي والعمل العميق'}
                {activeTab === 'exams' && 'التقييم الشامل والتدريب التفاعلي'}
                {activeTab === 'glossary' && 'الموسوعة اللغوية والقاموس'}
              </div>
              <h2 className={`text-sm sm:text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-[#2d2219]'} flex items-center space-x-2 space-x-reverse`}>
                <span>{activeTab === 'dashboard' && 'لوحة القيادة والمساعد الذكي'}</span>
                <span>{activeTab === 'lessons' && 'مساحة التعلم (الوحدات والمعامل)'}</span>
                <span>{activeTab === 'exams' && 'ساحة التقييم والتمكين الأكاديمي'}</span>
                <span>{activeTab === 'glossary' && 'قاموس المصطلحات والمفاهيم'}</span>
              </h2>
            </div>
          )}

          {/* البلوك الفعلي الفخاري لعرض المكونات الفرعية بالكامل */}
          <div className={`${isFocusMode ? isDarkMode ? 'bg-[#1a1a17] border border-[#2e2e2a] rounded-3xl p-6 sm:p-10 shadow-sm' : 'bg-white border border-[#eaddca]/60 rounded-3xl p-6 sm:p-10 shadow-sm' : ''}`}>
            
            {/* PILAR 1: ADMINISTRATION HUB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className={`flex ${isDarkMode ? 'bg-[#292924] border-[#3a3a35]' : 'bg-[#f6f1e5] border-[#eaddca]'} p-1 rounded-xl border max-w-sm ml-auto`}>
                  <button
                    onClick={() => setAdminMode('dashboard')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-black transition-all ${
                      adminMode === 'dashboard'
                        ? isDarkMode ? 'bg-[#1a1a17] text-[#459b6d] shadow-3xs' : 'bg-white text-[#1e4631] shadow-3xs'
                        : `text-[#baa896] hover:text-${isDarkMode ? 'white' : '[#2d2219]'}`
                    }`}
                  >
                    إحصائيات التحصيل
                  </button>
                  <button
                    onClick={() => setAdminMode('researcher')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-black transition-all ${
                      adminMode === 'researcher'
                        ? isDarkMode ? 'bg-[#1a1a17] text-[#459b6d] shadow-3xs' : 'bg-white text-[#1e4631] shadow-3xs'
                        : `text-[#baa896] hover:text-${isDarkMode ? 'white' : '[#2d2219]'}`
                    }`}
                  >
                    الباحث الذكي 🧬
                  </button>
                  <button
                    onClick={() => setAdminMode('reminders')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-black transition-all relative ${
                      adminMode === 'reminders'
                        ? isDarkMode ? 'bg-[#1a1a17] text-[#459b6d] shadow-3xs' : 'bg-white text-[#1e4631] shadow-3xs'
                        : `text-[#baa896] hover:text-${isDarkMode ? 'white' : '[#2d2219]'}`
                    }`}
                  >
                    <span>التكرار المتباعد</span>
                    {reminders.filter(r => r.status !== 'reviewed').length > 0 && (
                      <span className="absolute left-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-[#c86446]" />
                    )}
                  </button>
                </div>

                {adminMode === 'dashboard' && (
                  <Dashboard 
                    progress={progress} 
                    reminders={reminders} 
                    onNavigateToSection={(tabId, extraId) => {
                      if (tabId === 'lessons') {
                        if (extraId) {
                          if (extraId.startsWith('unit_')) {
                            setCurrentUnitId(extraId);
                          } else {
                            setCurrentLessonId(extraId);
                            const foundUnit = CURRICULUM.find(u => u.lessons.some(l => l.id === extraId));
                            if (foundUnit) {
                              setCurrentUnitId(foundUnit.id);
                            }
                          }
                        }
                        setLearningMode('theory');
                        handleTabChange('lessons');
                      } else if (tabId === 'labs') {
                        if (extraId) {
                          setPreselectedLabId(extraId);
                        }
                        setLearningMode('lab');
                        handleTabChange('lessons');
                      } else if (tabId === 'worksheets') {
                        if (extraId) {
                          // Could preselect worksheet if needed
                        }
                        setEvaluationMode('worksheets');
                        handleTabChange('exams');
                      } else if (tabId === 'exams') {
                        setEvaluationMode('exams');
                        handleTabChange('exams');
                      } else {
                        handleTabChange(tabId);
                      }
                    }} 
                  />
                )}

                {adminMode === 'researcher' && (
                  <SmartResearcher 
                    onNavigateToSection={(tabId, extraId) => {
                      if (tabId === 'lessons') {
                        if (extraId) {
                          setCurrentLessonId(extraId);
                          const foundUnit = CURRICULUM.find(u => u.lessons.some(l => l.id === extraId));
                          if (foundUnit) {
                            setCurrentUnitId(foundUnit.id);
                          }
                        }
                        setLearningMode('theory');
                        handleTabChange('lessons');
                      } else if (tabId === 'labs') {
                        if (extraId) {
                          setPreselectedLabId(extraId);
                        }
                        setLearningMode('lab');
                        handleTabChange('lessons');
                      }
                    }}
                    isDarkMode={isDarkMode}
                  />
                )}

                {adminMode === 'reminders' && (
                  <ReviewReminders 
                    reminders={reminders}
                    onAddReminder={handleAddReminder}
                    onRemoveReminder={handleRemoveReminder}
                    onMarkReviewed={handleMarkReviewed}
                  />
                )}
              </div>
            )}

            {/* PILAR 2: LEARNING SPACE HUB (مساحة التعلم والوحدات المندمجة) */}
            {activeTab === 'lessons' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`flex ${isDarkMode ? 'bg-[#292924] border-[#3a3a35]' : 'bg-[#f6f1e5] border-[#eaddca]'} p-1.5 rounded-2xl border max-w-md mx-auto w-full shadow-3xs`}>
                  <button
                    onClick={() => setLearningMode('theory')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
                      learningMode === 'theory'
                        ? isDarkMode ? 'bg-[#1a1a17] text-[#459b6d] border border-[#3a3a35]' : 'bg-white text-[#1e4631] shadow-3xs border border-[#eaddca]/40'
                        : `text-[#baa896] hover:text-${isDarkMode ? 'white' : '[#2d2219]'}`
                    }`}
                  >
                    <BookOpen className="w-4 h-4 ml-1.5" />
                    <span>الشرح النظري والمفاهيم 📖</span>
                  </button>
                  <button
                    onClick={() => {
                      const resolvedLab = preselectedLabId || 'lab_u1_l1';
                      setPreselectedLabId(resolvedLab);
                      setLearningMode('lab');
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
                      learningMode === 'lab'
                        ? isDarkMode ? 'bg-[#1a1a17] text-[#459b6d] border border-[#3a3a35]' : 'bg-white text-[#1e4631] shadow-3xs border border-[#eaddca]/40'
                        : `text-[#baa896] hover:text-${isDarkMode ? 'white' : '[#2d2219]'}`
                    }`}
                  >
                    <Beaker className="w-4 h-4 ml-1.5" />
                    <span>المعمل الافتراضي التطبيقي 🧪</span>
                  </button>
                </div>
                
                {learningMode === 'theory' ? (
                  <LessonViewer 
                    progress={progress} 
                    onUpdateProgress={(updater) => setProgress(updater)} 
                    onAddReminder={handleAddReminder} 
                    onNavigateToLab={(labId) => {
                      setPreselectedLabId(labId);
                      setLearningMode('lab');
                      triggerToast('تم توجيهك إلى المعمل التفاعلي فسيولوجياً بنجاح.');
                    }}
                    initialUnitId={currentUnitId}
                    initialLessonId={currentLessonId}
                    onClearInitialIds={() => {
                      setCurrentUnitId(undefined);
                      setCurrentLessonId(undefined);
                    }}
                  />
                ) : (
                  <VirtualLab 
                    initialLabId={preselectedLabId} 
                    progress={progress}
                    onUpdateProgress={(updater) => setProgress(updater)}
                    isDarkMode={isDarkMode}
                  />
                )}
              </div>
            )}

            {/* PILAR 3: EVALUATION HUB */}
            {activeTab === 'exams' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`flex ${isDarkMode ? 'bg-[#292924] border-[#3a3a35]' : 'bg-[#f6f1e5] border-[#eaddca]'} p-1.5 rounded-2xl border max-w-md mx-auto w-full shadow-3xs`}>
                  <button
                    onClick={() => setEvaluationMode('exams')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
                      evaluationMode === 'exams'
                        ? isDarkMode ? 'bg-[#1a1a17] text-[#459b6d] border border-[#3a3a35]' : 'bg-white text-[#1e4631] shadow-3xs border border-[#eaddca]/40'
                        : `text-[#baa896] hover:text-${isDarkMode ? 'white' : '[#2d2219]'}`
                    }`}
                  >
                    <ClipboardCheck className="w-4 h-4 ml-1.5" />
                    <span>امتحانات الشهادة السودانية 📝</span>
                  </button>
                  <button
                    onClick={() => setEvaluationMode('worksheets')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
                      evaluationMode === 'worksheets'
                        ? isDarkMode ? 'bg-[#1a1a17] text-[#459b6d] border border-[#3a3a35]' : 'bg-white text-[#1e4631] shadow-3xs border border-[#eaddca]/40'
                        : `text-[#baa896] hover:text-${isDarkMode ? 'white' : '[#2d2219]'}`
                    }`}
                  >
                    <FileText className="w-4 h-4 ml-1.5" />
                    <span>أوراق العمل والتدريب التوليدي 📄</span>
                  </button>
                </div>
                
                <div className={`${isDarkMode ? 'bg-[#1a1a17] border-[#2e2e2a]' : 'bg-white border-[#eaddca]/60'} rounded-3xl p-4 sm:p-8 shadow-3xs`}>
                  {evaluationMode === 'exams' ? (
                    <ExamsSection 
                      progress={progress} 
                      onUpdateProgress={(updater) => setProgress(updater)} 
                    />
                  ) : (
                    <WorksheetsSection 
                      progress={progress}
                      onUpdateProgress={(updater) => setProgress(updater)}
                      onNavigateToTab={(tabId) => {
                        if (tabId === 'lessons') {
                          setLearningMode('theory');
                          handleTabChange('lessons');
                        } else {
                          handleTabChange(tabId);
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* PILAR 4: GLOSSARY HUB */}
            {activeTab === 'glossary' && (
              <div className="space-y-6 animate-fadeIn">
                <BiologyGlossary 
                  onNavigateToSection={(tabId, extraId) => {
                    if (tabId === 'lessons') {
                      if (extraId) {
                        setCurrentLessonId(extraId);
                        const foundUnit = CURRICULUM.find(u => u.lessons.some(l => l.id === extraId));
                        if (foundUnit) {
                          setCurrentUnitId(foundUnit.id);
                        }
                      }
                      setLearningMode('theory');
                      handleTabChange('lessons');
                    } else if (tabId === 'labs') {
                      if (extraId) {
                        setPreselectedLabId(extraId);
                      }
                      setLearningMode('lab');
                      handleTabChange('lessons');
                    }
                  }}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* التذييل المتناسق بالهوية الدافئة والليلة المحدثة */}
      <footer className={`border-t ${
        isDarkMode ? 'border-[#2e2e2a] bg-[#1a1a17]/40 text-[#baa896]' : 'border-[#eaddca] bg-[#f6f1e5]/40 text-[#7c6a59]'
      } text-center py-6 text-[10px] px-4 mt-auto transition-colors duration-300`} id="app-footer">
        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#2d2219]'}`}>المنصة التعليمية لطلاب الشهادة الثانوية السودانية - دراسة آمنة ومنظمة بلا مشتتات.</p>
        <p className="mt-1 font-mono text-[#a6937c]">حقوق المنهج محفوظة لوزارة التربية والتعليم بخت الرضا - جمهورية السودان.</p>
      </footer>

      {/* المساعد الذكي العائم للطالب */}
      <StudentAssistantBot 
        onNavigateToSection={(tabId, extraId) => {
          if (tabId === 'lessons') {
            if (extraId) {
              setCurrentLessonId(extraId);
              const foundUnit = CURRICULUM.find(u => u.lessons.some(l => l.id === extraId));
              if (foundUnit) {
                setCurrentUnitId(foundUnit.id);
              }
            }
            setLearningMode('theory');
            handleTabChange('lessons');
          } else if (tabId === 'labs') {
            if (extraId) {
              setPreselectedLabId(extraId);
            }
            setLearningMode('lab');
            handleTabChange('lessons');
          }
        }}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}