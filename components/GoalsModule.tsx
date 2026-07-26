'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
  X,
  PlusCircle,
  Award,
} from 'lucide-react';
import { AppState, FinancialGoal } from '@/lib/types';
import { calculateFinancials, formatCurrency, formatDateArabic } from '@/lib/financeUtils';

interface GoalsModuleProps {
  state: AppState;
  onAddGoal: (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'isCompleted'>) => void;
  onUpdateGoalSavings: (id: string, newSavedAmount: number) => void;
  onToggleGoalComplete: (id: string) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalsModule: React.FC<GoalsModuleProps> = ({
  state,
  onAddGoal,
  onUpdateGoalSavings,
  onToggleGoalComplete,
  onDeleteGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoalForSaving, setSelectedGoalForSaving] = useState<FinancialGoal | null>(null);
  const [addSavingsInput, setAddSavingsInput] = useState<string>('');

  const { walletBalance } = calculateFinancials(state);

  // Form state
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentSavedAmount, setCurrentSavedAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<'asset' | 'debt_settlement' | 'emergency_fund' | 'personal'>('asset');
  const [notes, setNotes] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    const numSaved = parseFloat(currentSavedAmount) || 0;
    if (isNaN(numTarget) || numTarget <= 0) return;
    if (!title.trim()) return;

    onAddGoal({
      title: title.trim(),
      targetAmount: numTarget,
      currentSavedAmount: Math.min(numSaved, numTarget),
      targetDate: targetDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      category,
      notes: notes.trim(),
    });

    setTitle('');
    setTargetAmount('');
    setCurrentSavedAmount('0');
    setNotes('');
    setIsModalOpen(false);
  };

  const handleSavingsDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForSaving) return;
    const added = parseFloat(addSavingsInput);
    if (isNaN(added) || added <= 0) return;

    const newTotal = selectedGoalForSaving.currentSavedAmount + added;
    onUpdateGoalSavings(selectedGoalForSaving.id, newTotal);

    if (newTotal >= selectedGoalForSaving.targetAmount) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    setSelectedGoalForSaving(null);
    setAddSavingsInput('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">متابعة الأهداف المالية والتجميع</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            حدّد هدفك التالي (شراء هاتف جديد، صيانة المكنة الكبرى، ادخار طوارئ) وتابع نسب الإنجاز والمتبقي
          </p>
        </div>

        <button
          id="btn-open-add-goal"
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة هدف مالى جديد</span>
        </button>
      </div>

      {/* Goals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.goals.length > 0 ? (
          state.goals.map((item) => {
            const remaining = Math.max(0, item.targetAmount - item.currentSavedAmount);
            const isCompleted = item.isCompleted || remaining <= 0;
            const progress = Math.min(100, Math.round((item.currentSavedAmount / item.targetAmount) * 100));

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between space-y-4 transition ${
                  isCompleted ? 'border-purple-300 bg-purple-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md">
                        {item.category === 'asset'
                          ? 'شراء أصول ومعدات'
                          : item.category === 'debt_settlement'
                          ? 'سداد ديون كبرى'
                          : item.category === 'emergency_fund'
                          ? 'صندوق طوارئ'
                          : 'هدف شخصي'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1.5">{item.title}</h4>
                    </div>

                    <button
                      onClick={() => {
                        onToggleGoalComplete(item.id);
                        if (!isCompleted) {
                          confetti({ particleCount: 80, spread: 60 });
                        }
                      }}
                      className={`text-[11px] font-bold px-3 py-1 rounded-full border transition ${
                        isCompleted
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-purple-100 hover:text-purple-800'
                      }`}
                    >
                      {isCompleted ? 'تم الإنجاز 🎉' : 'تحديد كمنجز'}
                    </button>
                  </div>

                  {/* Amounts Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">المبلغ المستهدف</span>
                      <span className="text-xs font-bold text-slate-800">
                        {formatCurrency(item.targetAmount, state.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">المُجمّع حالياً</span>
                      <span className="text-xs font-bold text-purple-700">
                        {formatCurrency(item.currentSavedAmount, state.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">المتبقي للهدف</span>
                      <span className={`text-xs font-bold ${remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatCurrency(remaining, state.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                      <span>نسبة الوصول للهدف:</span>
                      <span className="font-bold text-purple-800">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-500 mt-2 bg-slate-50/50 p-2 rounded-lg italic">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>تاريخ المستهدف: {formatDateArabic(item.targetDate)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCompleted && (
                      <button
                        onClick={() => {
                          setSelectedGoalForSaving(item);
                          setAddSavingsInput('');
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>إضافة مدخرات</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteGoal(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="حذف الهدف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Target className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">لا توجد أهداف مالية مسجلة بعد.</p>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">إضافة هدف مالي جديد</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان الهدف *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء مكنة جديدة، سداد الجمعية الكبيرة، ادخار طوارئ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المستهدف (ج.م) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-purple-800 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المجمع حالياً (ج.م)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={currentSavedAmount}
                    onChange={(e) => setCurrentSavedAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الهدف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-purple-500 outline-none bg-white"
                  >
                    <option value="asset">شراء أصول ومعدات (مكنة/موبايل)</option>
                    <option value="debt_settlement">سداد ديون كبرى</option>
                    <option value="emergency_fund">صندوق طوارئ</option>
                    <option value="personal">هدف شخصي / للأسرة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الهدف المستهدف</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: خصصت له 50 ج.م من كل شيفت يومي"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-purple-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition shadow-sm"
                >
                  حفظ الهدف
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Deposit Savings Modal */}
      {selectedGoalForSaving && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">إضافة مدخرات للهدف</h3>
              </div>
              <button
                onClick={() => setSelectedGoalForSaving(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavingsDeposit} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">الهدف الحالي:</div>
                <div className="text-sm font-bold text-slate-900">{selectedGoalForSaving.title}</div>
                <div className="text-xs text-purple-700 font-semibold mt-1">
                  المجمع حالياً: {formatCurrency(selectedGoalForSaving.currentSavedAmount, state.currency)} من أصل {formatCurrency(selectedGoalForSaving.targetAmount, state.currency)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المراد إضافته الآن (ج.م) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={addSavingsInput}
                  onChange={(e) => setAddSavingsInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-purple-800 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoalForSaving(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition shadow-sm"
                >
                  تأكيد إضافة الادخار
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
