'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  TrendingUp,
  X,
  CheckCircle2,
} from 'lucide-react';
import { AppState, IncomeCategory, IncomeRecord } from '@/lib/types';
import { formatCurrency, formatDateArabic } from '@/lib/financeUtils';

interface IncomeModuleProps {
  state: AppState;
  onAddIncome: (record: Omit<IncomeRecord, 'id' | 'createdAt'>) => void;
  onDeleteIncome: (id: string) => void;
  isAddModalOpenInitially?: boolean;
}

const CATEGORY_LABELS: Record<IncomeCategory, { label: string; color: string }> = {
  orders: { label: 'تحصيل أوردرات', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  tips: { label: 'إكرامية وتيبس', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  salary: { label: 'راتب/يومية', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  other: { label: 'إيراد آخر', color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export const IncomeModule: React.FC<IncomeModuleProps> = ({
  state,
  onAddIncome,
  onDeleteIncome,
  isAddModalOpenInitially = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [category, setCategory] = useState<IncomeCategory>('orders');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفـر');
      return;
    }
    if (!source.trim()) {
      alert('يرجى كتابة البيان / مصدر الدخل (مثال: اسم المطعم، الصيدلية، أو العميل)');
      return;
    }

    onAddIncome({
      amount: numAmount,
      source: source.trim(),
      category,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    });

    // Reset
    setAmount('');
    setSource('');
    setNotes('');
    setCategory('orders');
    setIsModalOpen(false);
  };

  // Filter incomes
  const filteredIncomes = state.incomes.filter((item) => {
    const matchesSearch =
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFilteredAmount = filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-md backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">تسجيل وإدارة المقبوضات والدخل</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            سجّل كل إيراداتك اليومية من أوردرات المطاعم، الصيدليات، والعملاء والتيبس
          </p>
        </div>

        <button
          id="btn-open-add-income"
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مقبوضات جديدة</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 shadow-md backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="بحث باسم المطعم أو العميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategoryFilter === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل ({state.incomes.length})
            </button>
            {Object.entries(CATEGORY_LABELS).map(([catKey, { label }]) => (
              <button
                key={catKey}
                onClick={() => setSelectedCategoryFilter(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategoryFilter === catKey
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

        </div>

        {/* Total Filtered Summary */}
        <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>عدد المعاملات المعروضة: {filteredIncomes.length}</span>
          <span className="font-bold text-emerald-400">
            إجمالي المعروض: {formatCurrency(totalFilteredAmount, state.currency)}
          </span>
        </div>
      </div>

      {/* Income Records Table / Cards */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-md backdrop-blur-md overflow-hidden">
        {filteredIncomes.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {filteredIncomes.map((item) => {
              const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other;
              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl mt-0.5 border border-emerald-500/30">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{item.source}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {catInfo.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateArabic(item.date)}
                        </span>
                        {item.notes && <span>• {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4">
                    <span className="text-base sm:text-lg font-bold text-emerald-400">
                      +{formatCurrency(item.amount, state.currency)}
                    </span>
                    <button
                      onClick={() => onDeleteIncome(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="حذف الإيراد"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">لا توجد سجلات دخل مطابقة للبحث.</p>
          </div>
        )}
      </div>

      {/* Add Income Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 text-white animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">تسجيل دخل / تحصيل جديد</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              
              {/* Source Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  البيان / الوصف (اسم المطعم، الصيدلية، أو العميل) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مطعم البرنس، صيدلية العزبي، أوردر التجمع"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المبلغ (ج.م) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">تصنيف الإيراد</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                >
                  <option value="orders">تحصيل أوردرات</option>
                  <option value="tips">إكرامية وتيبس</option>
                  <option value="salary">راتب / يومية ثابتة</option>
                  <option value="other">إيراد آخر</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ملاحظات إضافية (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: تحصيل شيفت المساء، باقي أوردر 23"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-sm"
                >
                  حفظ المقبوضات
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
