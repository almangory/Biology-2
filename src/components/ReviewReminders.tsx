/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SpacedReminder } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Calendar, Check, Trash2, Clock, AlertCircle } from 'lucide-react';

interface ReviewRemindersProps {
  reminders: SpacedReminder[];
  onAddReminder: (lessonId: string, lessonTitle: string, unitTitle: string, days: number) => void;
  onRemoveReminder: (reminderId: string) => void;
  onMarkReviewed: (reminderId: string) => void;
}

export default function ReviewReminders({ reminders, onAddReminder, onRemoveReminder, onMarkReviewed }: ReviewRemindersProps) {
  const [selectedDays, setSelectedDays] = useState(3);

  // Separate reminders into pending/overdue and reviewed
  const pendingReminders = reminders.filter(r => r.status !== 'reviewed');
  const completedReminders = reminders.filter(r => r.status === 'reviewed');

  const getStatusBadge = (status: 'pending' | 'reviewed' | 'overdue', dateStr: string) => {
    const isOverdue = new Date(dateStr).getTime() < Date.now() && status !== 'reviewed';
    if (isOverdue) {
      return (
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 flex items-center space-x-1 space-x-reverse animate-pulse">
          <AlertCircle className="w-3 h-3 ml-0.5" />
          <span>مراجعة متأخرة!</span>
        </span>
      );
    }
    if (status === 'reviewed') {
      return (
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          تمت المراجعة
        </span>
      );
    }
    return (
      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
        مجدولة
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SD', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 text-right" id="reminders-section-wrapper">
      {/* Overview stats and info */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Bell className="w-5 h-5 text-emerald-600 animate-bounce" />
            <h3 className="text-base font-extrabold text-slate-850">نظام التنبيهات الذكي للمراجعة الدورية</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            يقوم هذا النظام بجدولة مواعيد المراجعة استناداً إلى آلية التكرار المتباعد (Spaced Repetition) لتثبيت المعلومات البيولوجية الصعبة في الذاكرة طويلة المدى.
          </p>
        </div>

        <div className="flex space-x-3 space-x-reverse bg-slate-50 border border-slate-200 rounded-xl py-2 px-4">
          <div className="text-center min-w-[70px] border-l border-slate-200 pl-3">
            <span className="text-[10px] font-bold text-slate-500 block">قيد الانتظار</span>
            <span className="text-base font-black text-rose-600 font-mono">{pendingReminders.length}</span>
          </div>
          <div className="text-center min-w-[70px]">
            <span className="text-[10px] font-bold text-slate-500 block">تمت مراجعتها</span>
            <span className="text-base font-black text-emerald-700 font-mono">{completedReminders.length}</span>
          </div>
        </div>
      </div>

      {/* Main Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="reminders-main-grid">
        {/* Active pending reminders list (Col-span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 min-h-[350px] shadow-xs">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-sm font-extrabold text-slate-800">جلسات المراجعة المجدولة القادمة</h4>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {pendingReminders.length > 0 ? (
                  pendingReminders.map(reminder => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center justify-between gap-4 text-xs font-semibold"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <button
                          onClick={() => onMarkReviewed(reminder.id)}
                          className="w-7 h-7 rounded-full bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 flex items-center justify-center transition-all shadow-3xs"
                          title="تمت المراجعة وحفظ الفهم"
                        >
                          <Check className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onRemoveReminder(reminder.id)}
                          className="w-7 h-7 rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-all"
                          title="حذف التنبيه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 text-right space-y-1">
                        <div className="flex items-center justify-end space-x-2 space-x-reverse">
                          {getStatusBadge(reminder.status, reminder.scheduledTime)}
                          <h5 className="font-extrabold text-slate-800">{reminder.lessonTitle}</h5>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-end space-x-3 space-x-reverse">
                          <span className="flex items-center space-x-1 space-x-reverse">
                            <Clock className="w-3 h-3 ml-1 text-slate-450" />
                            <span>كل {reminder.intervalDays} أيام</span>
                          </span>
                          <span className="text-emerald-700">({reminder.unitTitle})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-end space-x-1 space-x-reverse pt-1">
                          <Calendar className="w-3 h-3 ml-1 text-slate-450" />
                          <span>موعد المراجعة: {formatDate(reminder.scheduledTime)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-2">
                    <Calendar className="w-12 h-12 text-slate-200 animate-pulse" />
                    <h5 className="font-bold text-slate-600">لا توجد جلسات مراجعة مجدولة حالياً</h5>
                    <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed font-semibold">
                      عند تصفحك لأي درس في قسم الوحدات الدراسية، يمكنك تفعيل جرس التنبيه وجدولة مراجعته الدورية التكرارية بنقرة زر واحدة.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Spaced repetition rules and completed lists (Col-span 5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Spaced repetition intervals description */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
            <h4 className="text-sm font-extrabold text-slate-850">ما هي آلية التكرار المتباعد؟</h4>
            <p className="text-xs text-slate-650 leading-relaxed font-semibold">
              تعتمد المذاكرة الذاتية الفعالة على مراجعة الدروس بانتظام على فترات متزايدة:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-emerald-700 font-extrabold font-mono">بعد 24 ساعة</span>
                <span className="text-slate-700 font-bold">المراجعة الأولى (تخطي منحنى النسيان)</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-sky-700 font-extrabold font-mono">بعد 3 أيام</span>
                <span className="text-slate-700 font-bold">المراجعة الثانية (ربط المفاهيم الكيميائية)</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-rose-700 font-extrabold font-mono">بعد 7 أيام</span>
                <span className="text-slate-700 font-bold">المراجعة الثالثة (التمثيل بالذاكرة الدائمة)</span>
              </div>
            </div>
          </div>

          {/* Log of completed reviews */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">سجل جلسات المراجعة المكتملة:</h4>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {completedReminders.length > 0 ? (
                completedReminders.map(reminder => (
                  <div key={reminder.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-400 font-mono text-[9px]">تم بنجاح</span>
                    <div className="text-right">
                      <span className="text-slate-800 block font-extrabold">{reminder.lessonTitle}</span>
                      <span className="text-[10px] text-emerald-700">({reminder.unitTitle})</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-xs text-slate-450 font-semibold">لا يوجد سجل لمراجعات مكتملة بعد.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
