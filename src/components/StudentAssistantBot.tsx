/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { generateSmartAnswer, SmartAnswerResponse } from '../utils/search';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, X, Send, Sparkles, AlertCircle, HelpCircle, 
  ArrowLeftRight, BookOpen, GraduationCap, RefreshCw, Zap
} from 'lucide-react';

interface StudentAssistantBotProps {
  onNavigateToSection: (tabId: string, extraId?: string) => void;
  isDarkMode: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  smartResponse?: SmartAnswerResponse;
}

const PRESET_CHATS = [
  { text: 'ما هو النيفرون وما هي بنيته؟', label: 'تركيب النيفرون' },
  { text: 'ما هي أعراض مرض الكواشيركور؟', label: 'مرض الكواشيركور' },
  { text: 'ما هي وظيفة الكبد والبنكرياس؟', label: 'الكبد والبنكرياس' },
  { text: 'ما هو دور محفظة بومان؟', label: 'محفظة بومان' }
];

export default function StudentAssistantBot({ onNavigateToSection, isDarkMode }: StudentAssistantBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'مرحباً بك ! أنا المساعد الأكاديمي الذكي لمادة الأحياء. كيف يمكنني مساعدتك اليوم في فهم الدروس، شرح الرسومات التشريحية، أو مراجعة أسئلة الشهادة السودانية السابقة؟ 🧬',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewBadge, setHasNewBadge] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasNewBadge(false);
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate smart search & processing delay
    setTimeout(() => {
      const smartResponse = generateSmartAnswer(trimmed);
      
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: smartResponse.answerText,
        timestamp: new Date(),
        smartResponse
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend(input);
    }
  };

  // Simple Markdown line parser for rich chat answer rendering
  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.sender === 'user') {
      return <p className="text-xs sm:text-sm font-semibold leading-relaxed text-right">{msg.text}</p>;
    }

    const lines = msg.text.split('\n');
    return (
      <div className="space-y-1.5 text-right font-medium">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Headings (### or ##)
          if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
            const headerText = trimmed.replace(/^(###|##)\s*/, '');
            return (
              <h5 key={idx} className={`text-xs sm:text-sm font-black ${isDarkMode ? 'text-emerald-400' : 'text-[#1e4631]'} mt-2.5 mb-1.5 border-r-2 border-emerald-600 pr-2`}>
                {headerText}
              </h5>
            );
          }

          // Separator (---)
          if (trimmed === '---') {
            return <hr key={idx} className={`my-2.5 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`} />;
          }

          // Subbullet (  * or   -)
          if (line.startsWith('  *') || line.startsWith('  -')) {
            const itemText = line.replace(/^\s*(\*|-)\s*/, '');
            return (
              <div key={idx} className={`mr-6 my-1 text-[11px] sm:text-xs leading-relaxed flex items-start space-x-1 space-x-reverse ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
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
                <div key={idx} className={`mr-3 my-1 text-[11px] sm:text-xs leading-relaxed flex items-start space-x-1.5 space-x-reverse ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <span className="text-emerald-600 shrink-0 select-none mt-1 text-[8px]">✦</span>
                  <span className="flex-1 font-semibold">
                    <strong>{parts[1]}</strong>
                    {parts.slice(2).join('')}
                  </span>
                </div>
              );
            }

            return (
              <div key={idx} className={`mr-3 my-1 text-[11px] sm:text-xs leading-relaxed flex items-start space-x-1.5 space-x-reverse ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                <span className="text-emerald-600 shrink-0 select-none mt-1 text-[8px]">✦</span>
                <span className="flex-1 font-semibold">{itemText}</span>
              </div>
            );
          }

          // Standard paragraphs
          return (
            <p key={idx} className={`text-[11px] sm:text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} mb-1.5 text-justify`}>
              {trimmed}
            </p>
          );
        })}

        {/* Deep-link action button if matching source is found */}
        {msg.smartResponse && msg.smartResponse.sourceId && msg.smartResponse.sourceType !== 'general' && (
          <div className="pt-2 mt-2 border-t border-slate-100/60">
            <button
              onClick={() => {
                if (msg.smartResponse?.sourceType === 'diagram' && msg.smartResponse.diagramId) {
                  onNavigateToSection('labs', msg.smartResponse.diagramId);
                } else if (msg.smartResponse?.lessonId) {
                  onNavigateToSection('lessons', msg.smartResponse.lessonId);
                }
                setIsOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1e4631] text-[10px] font-bold transition-all border border-emerald-100"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>اقرأ الدرس كاملاً في المنصة 📖</span>
              <ArrowLeftRight className="w-3 h-3 rotate-180 mr-auto" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 text-right" id="student-assistant-floating-bot">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-[90vw] sm:w-[420px] h-[550px] rounded-3xl border shadow-2xl flex flex-col overflow-hidden mb-4 ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-white' 
                : 'bg-white border-[#ebdcb9] text-slate-800'
            }`}
          >
            {/* Header */}
            <div className={`p-4 flex items-center justify-between border-b ${
              isDarkMode 
                ? 'bg-gradient-to-r from-emerald-950 to-slate-950 border-slate-800' 
                : 'bg-gradient-to-r from-[#1e4631] to-[#153223] border-[#eaddca]/60 text-white'
            }`}>
              <button 
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-lg transition-all ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white/10 text-emerald-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="text-left">
                  <h4 className="text-xs sm:text-sm font-black flex items-center gap-1.5 justify-end">
                    <span>المساعد المنهجي الذكي</span>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </h4>
                  <p className={`text-[9px] font-semibold text-emerald-300`}>مستشار الأحياء بدون إنترنت ⚡</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Offline Alert Indicator */}
            <div className={`px-4 py-1.5 text-[9px] font-bold flex items-center justify-between ${
              isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-emerald-50/80 text-[#1e4631]'
            } border-b border-dashed ${isDarkMode ? 'border-slate-900' : 'border-[#eaddca]/30'}`}>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>بحث داخلي فائق السرعة وبدون أي تكلفة أو استهلاك طاقة</span>
              </span>
              <span className="bg-emerald-600/10 text-emerald-700 px-1.5 py-0.5 rounded-md">مساعد ذكي</span>
            </div>

            {/* Messages body */}
            <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin ${
              isDarkMode ? 'bg-slate-950/60' : 'bg-[#fdfcf9]'
            }`}>
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-amber-600 text-white'
                      : isDarkMode ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' : 'bg-emerald-50 text-emerald-900 border border-emerald-100'
                  }`}>
                    {msg.sender === 'user' ? (
                      <span className="text-[10px] font-black">طالب</span>
                    ) : (
                      <GraduationCap className="w-4 h-4" />
                    )}
                  </div>

                  <div className={`p-3.5 rounded-2xl max-w-[80%] shadow-3xs ${
                    msg.sender === 'user'
                      ? 'bg-amber-600 text-white rounded-tl-none'
                      : isDarkMode ? 'bg-slate-900 border border-slate-800 rounded-tr-none' : 'bg-white border border-[#eaddca]/50 rounded-tr-none'
                  }`}>
                    {renderMessageContent(msg)}
                    <span className={`block text-[8px] mt-1.5 text-left ${
                      msg.sender === 'user' ? 'text-amber-100' : 'text-slate-400'
                    }`}>
                      {msg.timestamp.toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-900 border border-emerald-100 shrink-0`}>
                    <GraduationCap className="w-4 h-4 text-emerald-700 animate-pulse" />
                  </div>
                  <div className={`p-3.5 rounded-2xl rounded-tr-none ${
                    isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-[#eaddca]/40'
                  } flex items-center space-x-1`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Presets Carousel */}
            <div className={`px-4 py-2 border-t ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#f6f1e5]/30 border-slate-100'
            }`}>
              <p className={`text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} mb-1.5 flex items-center gap-1`}>
                <HelpCircle className="w-3 h-3 text-amber-500" />
                <span>اختر سؤالاً سريعاً من المنهج:</span>
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
                {PRESET_CHATS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.text)}
                    className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${
                      isDarkMode 
                        ? 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300' 
                        : 'bg-white hover:bg-emerald-50 border-slate-200 text-slate-600 hover:border-emerald-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer Form */}
            <div className={`p-3 border-t flex items-center gap-2 ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-[#eaddca]/30'
            }`}>
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                  input.trim()
                    ? 'bg-[#1e4631] text-white hover:bg-[#153223]'
                    : isDarkMode ? 'bg-slate-900 text-slate-700' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
              <input
                type="text"
                placeholder="اسألني عن أي مفهوم بالأحياء..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isTyping}
                className={`flex-1 py-2.5 px-3.5 text-xs rounded-xl font-bold transition-all outline-none border ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-[#1e4631] focus:bg-white'
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl border relative transition-all ${
          isOpen
            ? 'bg-[#c86446] border-[#c86446] text-white'
            : isDarkMode
              ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
              : 'bg-[#1e4631] hover:bg-[#153223] border-[#1e4631] text-white'
        }`}
        title="المساعد الأكاديمي الذكي"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center"
            >
              <MessageSquare className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ripple for offline smart helper */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-white"></span>
          </span>
        )}

        {/* Notification badge */}
        {!isOpen && hasNewBadge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-12 right-0 bg-amber-550 bg-amber-500 border border-white text-white text-[9px] font-black py-1 px-2.5 rounded-xl whitespace-nowrap shadow-md"
          >
            اسألني هنا! 🧬
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
