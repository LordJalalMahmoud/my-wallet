'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Calendar,
  TrendingDown,
  X,
  Link2,
  AlertCircle,
} from 'lucide-react';
import { AppState, ExpenseCategory, ExpenseRecord } from '@/lib/types';
import { formatCurrency, formatDateArabic } from '@/lib/financeUtils';

interface ExpenseModuleProps {
  state: AppState;
  onAddExpense: (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
  isAddModalOpenInitially?: boolean;
}

const CATEGORY_LABELS: Record<ExpenseCategory, { label: string; color: string }> = {
  order_upfront: { label: 'عربون أوردرات مقدم', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  fuel: { label: 'وقود وبنزين', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  bike_maintenance: { label: 'صيانة المكنة', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  phone: { label: 'شحن/موبايل', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  meals: { label: 'وجبات ومشروبات', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  home: { label: 'مصاريف منزلية', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  other: { label: 'مصروف آخر', color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export const ExpenseModule: React.FC<ExpenseModuleProps> = ({
  state,
  onAddExpense,
  onDeleteExpense,
  isAddModalOpenInitially = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [linkedIncomeId, setLinkedIncomeId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!description.trim()) return;

    onAddExpense({
      amount: numAmount,
      description: description.trim(),
      category,
      date: date || new Date().toISOString().split('T')[0],
      linkedIncomeId: linkedIncomeId || undefined,
      notes: notes.trim(),
    });

    // Reset
    setAmount('');
    setDescription('');
    setNotes('');
    setCategory('fuel');
    setLinkedIncomeId('');
    setIsModalOpen(false);
  };

  const filteredExpenses = state.expenses.filter((item) => {
    const matchesSearch =
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFilteredAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">إدارة المصروفات التشغيلية والشخصية</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تتبع مصاريفك اليومية (البنزين، صيانة المكنة، الوجبات، والمبالغ المدفوعة مقدماً للأوردرات)
          </p>
        </div>

        <button
          id="btn-open-add-expense"
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل مصروف جديد</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="بحث ببيان المصروف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل ({state.expenses.length})
            </button>
            {Object.entries(CATEGORY_LABELS).map(([catKey, { label }]) => (
              <button
                key={catKey}
                onClick={() => setSelectedCategoryFilter(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategoryFilter === catKey
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>عدد المعاملات المعروضة: {filteredExpenses.length}</span>
          <span className="font-bold text-rose-700">
            إجمالي المصروفات المعروضة: {formatCurrency(totalFilteredAmount, state.currency)}
          </span>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredExpenses.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredExpenses.map((item) => {
              const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other;
              const linkedIncome = state.incomes.find((i) => i.id === item.linkedIncomeId);

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl mt-0.5">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">{item.description}</h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateArabic(item.date)}
                        </span>

                        {linkedIncome && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            مربوط بمقبوضات: {linkedIncome.source}
                          </span>
                        )}

                        {item.notes && <span>• {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4">
                    <span className="text-base sm:text-lg font-bold text-rose-600">
                      -{formatCurrency(item.amount, state.currency)}
                    </span>
                    <button
                      onClick={() => onDeleteExpense(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="حذف المصروف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <TrendingDown className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">لا توجد مصروفات مسجلة بعد.</p>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">تسجيل مصروف جديد</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البيان / الوصف (سبب المصروف) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: بنزين 92، تغيير زيت المكنة، عربون أوردر كباب"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-rose-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ (ج.م) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-rose-700 focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تصنيف المصروف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-rose-500 outline-none bg-white"
                >
                  <option value="fuel">وقود وبنزين</option>
                  <option value="order_upfront">عربون/دفع مقدم لأوردرات</option>
                  <option value="bike_maintenance">صيانة المكنة / السكوتر</option>
                  <option value="phone">شحن باقة وصيانة الموبايل</option>
                  <option value="meals">وجبات ومشروبات الشيفت</option>
                  <option value="home">مصاريف منزلية وشخصية</option>
                  <option value="other">مصروف آخر</option>
                </select>
              </div>

              {/* Link to Income Record (for upfront orders) */}
              {category === 'order_upfront' && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                    <Link2 className="w-4 h-4" />
                    <span>ربط العربون بتحصيل أوردر (اختياري)</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    هل تم تحصيل قيمة هذا الأوردر لاحقاً في قائمة المقبوضات؟ يمكنك ربطه للتأكد من تسويته:
                  </p>
                  <select
                    value={linkedIncomeId}
                    onChange={(e) => setLinkedIncomeId(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs bg-white text-slate-800"
                  >
                    <option value="">بدون ربط (مستقل)</option>
                    {state.incomes.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        {inc.source} - {inc.amount} {state.currency} ({inc.date})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: عند محطة موبيل، ورشة عم حسن"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-rose-500 outline-none"
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
                  className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition shadow-sm"
                >
                  حفظ المصروف
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
