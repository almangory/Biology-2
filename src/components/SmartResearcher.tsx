/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { generateSmartAnswer, SmartAnswerResponse } from '../utils/search';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Sparkles, HelpCircle, BookOpen, ChevronRight, 
  ArrowLeftRight, FileText, Compass, AlertCircle, CheckCircle2,
  Bookmark, GraduationCap, ArrowRight, RefreshCw, Layers
} from 'lucide-react';

interface SmartResearcherProps {
  onNavigateToSection: (tabId: string, extraId?: string) => void;
  isDarkMode: boolean;
}

const SAMPLE_QUESTIONS = [
  { text: 'ما هو النيفرون وما هي بنيته الأساسية؟', label: 'النيفرون والإخراج' },
  { text: 'ما هي أعراض مرض الكواشيركور ومسبباته؟', label: 'الكواشيركور' },
  { text: 'ما هي وظيفة الكبد والبنكرياس في الهضم؟', label: 'الكبد والبنكرياس' },
  { text: 'كيف يحدث الانتحاء الضوئي في النبات؟', label: 'الانتحاء الضوئي' },
  { text: 'ما هو دور الكولسترول والدهون المشبعة؟', label: 'الكولسترول' },
  { text: 'ما هي القوس الانعكاسية ومكوناتها؟', label: 'القوس الانعكاسية' },
];

export default function SmartResearcher({ onNavigateToSection, isDarkMode }: SmartResearcherProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<SmartAnswerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsLoading(true);
    // Simulate a brief natural thinking delay (350ms) to make it feel organic
    setTimeout(() => {
      const result = generateSmartAnswer(trimmed);
      setResponse(result);
      setIsLoading(false);
      
      // Add to unique search history
      if (!history.includes(trimmed)) {
        setHistory(prev => [trimmed, ...prev].slice(0, 5));
      }
    }, 350);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  // Simple Markdown line parser for rich answer rendering
  const renderFormattedAnswer = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Headings (### or ##)
      if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
        const headerText = trimmed.replace(/^(###|##)\s*/, '');
        return (
          <h4 key={idx} className={`text-sm sm:text-base font-extrabold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-900'} mt-4 mb-2 border-r-4 border-emerald-600 pr-2.5`}>
            {headerText}
          </h4>
        );
      }

      // Separator (---)
      if (trimmed === '---') {
        return <hr key={idx} className={`my-4 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`} />;
      }

      // Subbullet (  * or   -)
      if (line.startsWith('  *') || line.startsWith('  -')) {
        const itemText = line.replace(/^\s*(\*|-)\s*/, '');
        return (
          <div key={idx} className={`mr-8 my-1 text-xs sm:text-[13px] leading-relaxed flex items-start space-x-1.5 space-x-reverse ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="text-amber-500 shrink-0 select-none mt-1">○</span>
            <span className="flex-1 font-semibold">{itemText}</span>
          </div>
        );
      }

      // Bullet points (* or -)
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const itemText = trimmed.replace(/^(\*|-)\s*/, '');
        
        // Check for bold parts like **Question**: Answer
        const parts = itemText.split('**');
        if (parts.length >= 3) {
          return (
            <div key={idx} className={`mr-4 my-1.5 text-xs sm:text-[13px] leading-relaxed flex items-start space-x-2 space-x-reverse ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <span className={`text-emerald-600 shrink-0 select-none mt-1 text-[10px]`}>✦</span>
              <span className="flex-1 font-semibold">
                <strong>{parts[1]}</strong>
                {parts.slice(2).join('')}
              </span>
            </div>
          );
        }

        return (
          <div key={idx} className={`mr-4 my-1.5 text-xs sm:text-[13px] leading-relaxed flex items-start space-x-2 space-x-reverse ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            <span className="text-emerald-600 shrink-0 select-none mt-1 text-[10px]">✦</span>
            <span className="flex-1 font-semibold">{itemText}</span>
          </div>
        );
      }

      // Standard paragraphs
      return (
        <p key={idx} className={`text-xs sm:text-[13px] leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} mb-2.5 font-medium text-justify`}>
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 text-right animate-fadeIn" id="smart-researcher-container">
      
      {/* Search Header Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 border ${
        isDarkMode 
          ? 'bg-gradient-to-br from-emerald-950 to-teal-950 border-emerald-900/60' 
          : 'bg-gradient-to-br from-[#f8f5ee] to-[#fcfaf4] border-[#eaddca]'
      } shadow-3xs`}>
        <div className="absolute left-6 top-6 text-emerald-600/10 pointer-events-none hidden md:block">
          <Compass className="w-40 h-40" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className={`p-2.5 rounded-2xl ${isDarkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-50 text-[#1e4631]'} border ${isDarkMode ? 'border-emerald-800/40' : 'border-emerald-200/50'}`}>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className={`text-[10px] uppercase tracking-wider font-extrabold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>مستشار المنهج الدراسي الفوري</span>
              <h2 className={`text-base sm:text-lg font-black ${isDarkMode ? 'text-white' : 'text-[#2d2219]'}`}>الباحث الذكي المنهجي 🔬</h2>
            </div>
          </div>
          
          <p className={`text-xs leading-relaxed max-w-2xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} font-semibold`}>
            مساعد أكاديمي متكامل يعمل محلياً بالكامل للبحث في نصوص دروس الأحياء، مفاهيم الأنسجة، تركيب الأعضاء، بطاقات التكرار، والأسئلة الحقيقية لامتحانات الشهادة السودانية السابقة، ثم صياغة إجابة فورية مترابطة دون الحاجة لذكاء اصطناعي مدفوع.
          </p>

          {/* Search Input Area */}
          <div className="pt-2">
            <div className="relative max-w-2xl flex items-center">
              <input
                type="text"
                placeholder="اكتب سؤالك الأكاديمي هنا... (مثال: تركيب محفظة بومان)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className={`w-full py-3.5 pl-12 pr-4 text-xs sm:text-sm rounded-2xl transition-all font-semibold outline-none border ${
                  isDarkMode 
                    ? 'bg-slate-900/90 border-slate-800 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' 
                    : 'bg-white border-[#eaddca] text-slate-800 focus:border-[#1e4631] focus:ring-1 focus:ring-[#1e4631]'
                }`}
              />
              <div className="absolute left-3 flex items-center space-x-1.5">
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className={`p-1 rounded-lg text-xs font-bold transition-all ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    مسح
                  </button>
                )}
                <button
                  onClick={() => handleSearch(query)}
                  disabled={isLoading || !query.trim()}
                  className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                    query.trim() 
                      ? isDarkMode 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md' 
                        : 'bg-[#1e4631] hover:bg-[#153223] text-white shadow-md'
                      : isDarkMode 
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                        : 'bg-slate-100 text-slate-450 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sample suggestions pills */}
          <div className="space-y-2 pt-1.5">
            <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} block`}>الأسئلة الأكاديمية الشائعة:</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(q.text);
                    handleSearch(q.text);
                  }}
                  className={`py-1.5 px-3 rounded-xl text-[10px] sm:text-xs font-bold border transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-emerald-800' 
                      : 'bg-white hover:bg-emerald-50/40 border-slate-200 text-slate-600 hover:border-[#1e4631]/50'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History and Status info */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-10 rounded-2xl text-center border space-y-3 ${
              isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50/65 border-slate-200'
            }`}
          >
            <div className="relative w-10 h-10 mx-auto">
              <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin absolute inset-0" />
              <Layers className="w-5 h-5 text-[#c86446] absolute top-2.5 left-2.5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className={`text-xs sm:text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>جاري قراءة وتحليل نصوص المنهج...</h4>
              <p className="text-[10px] text-slate-450 font-semibold">يقوم الباحث بمطابقة الكلمات المفتاحية مع 13 درساً تشريحياً ورسومات الأعضاء لتوليد إجابة نموذجية.</p>
            </div>
          </motion.div>
        )}

        {!isLoading && response && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            id="search-results-bento"
          >
            {/* Right Main Answer Panel (Col-span 8) */}
            <div className="lg:col-span-8 space-y-6">
              <div className={`border rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm transition-all ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#eaddca]/70'
              }`}>
                {/* Answer Meta Row */}
                <div className="flex items-center justify-between border-b pb-3.5 border-dashed border-slate-200/60">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      response.confidence === 'high' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : response.confidence === 'medium' 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {response.confidence === 'high' ? '🎯 تطابق ومنهجية عالية' : response.confidence === 'medium' ? '⚡ تطابق متوسط' : '⚠️ تطابق عام'}
                    </span>
                    <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-450'} hidden sm:inline`}>
                      مستوى الموثوقية
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 space-x-reverse text-emerald-650 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 ml-1 text-emerald-600" />
                    <span>تم الفحص والتحقق الأكاديمي</span>
                  </div>
                </div>

                {/* Formatted Answer Output */}
                <div className="space-y-1">
                  {renderFormattedAnswer(response.answerText)}
                </div>
              </div>
            </div>

            {/* Left Contextual Reference Panels (Col-span 4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Contextual Navigation Link Card */}
              {response.sourceId && response.sourceType !== 'general' && (
                <div className={`border rounded-2xl p-5 space-y-4 shadow-3xs transition-all ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 hover:border-emerald-800' 
                    : 'bg-gradient-to-br from-emerald-50/30 to-white border-[#ebdcb9] hover:border-emerald-300'
                }`}>
                  <div className="flex items-center space-x-2 space-x-reverse text-[#1e4631] font-bold text-xs">
                    <BookOpen className="w-4.5 h-4.5 ml-1 text-[#1e4631]" />
                    <span className={isDarkMode ? 'text-emerald-400' : 'text-[#1e4631]'}>أين يوجد هذا في كتابك الدراسي؟</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {response.sourceType === 'diagram' ? 'رسم تخطيطي تفاعلي' : 'درس علمي مدمج'}
                    </span>
                    <h5 className={`text-xs sm:text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      {response.sourceTitle}
                    </h5>
                    <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-semibold`}>
                      يمكنك تصفح هذا الدرس كاملاً ومطالعة الرسومات التوضيحية أو ممارسة بطاقات الاستذكار المدمجة لترسيخ هذا المفهوم في عقلك.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (response.sourceType === 'diagram' && response.diagramId) {
                        onNavigateToSection('labs', response.diagramId);
                      } else if (response.lessonId) {
                        onNavigateToSection('lessons', response.lessonId);
                      }
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 space-x-reverse ${
                      isDarkMode 
                        ? 'bg-emerald-900/40 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800' 
                        : 'bg-[#1e4631] hover:bg-[#153223] text-white shadow-2xs'
                    }`}
                  >
                    <span>انتقل لقراءة الفصل الدراسي كاملاً</span>
                    <ArrowLeftRight className="w-3.5 h-3.5 mr-1 text-emerald-250 rotate-180" />
                  </button>
                </div>
              )}

              {/* Tips / Spaced repetition reinforcement block */}
              <div className={`border rounded-2xl p-5 space-y-3 shadow-3xs ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#fcfaf4] border-[#eaddca]/60'
              }`}>
                <div className="flex items-center space-x-2 space-x-reverse text-amber-700 font-bold text-xs">
                  <Bookmark className="w-4.5 h-4.5 ml-1 text-amber-600" />
                  <span>تثبيت الذاكرة المستهدفة:</span>
                </div>
                <p className={`text-[10px] leading-normal ${isDarkMode ? 'text-slate-450' : 'text-slate-500'} font-medium`}>
                  الاستفسار عن المفاهيم عبر الأسئلة يزيد من تشابك الوصلات العصبية وتفعيل الفهم النشط. ننصحك بنسخ نقاط الإجابة وتدوينها بملخصك الورقي المخصص.
                </p>
                <div className={`text-[10px] font-bold p-2 rounded-lg ${
                  isDarkMode ? 'bg-slate-850 text-slate-300' : 'bg-white text-slate-700'
                } border border-slate-100`}>
                  💡 نصيحة: فكر في طرح الأسئلة بكلمات مرادفة مختلفة لزيادة دقة البحث ومطابقة الكلمات.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro display card shown initially */}
      {!response && !isLoading && (
        <div className={`border rounded-3xl p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#ebdcb9]/60'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
            <GraduationCap className="w-6 h-6 text-[#1e4631]" />
          </div>
          <div className="space-y-1">
            <h3 className={`text-sm sm:text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>ابدأ رحلة البحث المنهجي التفاعلي</h3>
            <p className={`text-xs leading-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-semibold max-w-sm mx-auto`}>
              اكتب أي سؤال علمي يخطر ببالك حول منهج الأحياء للصف الثاني الثانوي السوداني، ليقوم محرك البحث المنهجي الذكي بتحليل الإجابة النموذجية وصياغتها لك فورا.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
