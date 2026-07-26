'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Calendar,
  CreditCard,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Check,
} from 'lucide-react';
import { AppState, LiabilityCategory, LiabilityRecord } from '@/lib/types';
import { formatCurrency, formatDateArabic } from '@/lib/financeUtils';

interface LiabilitiesModuleProps {
  state: AppState;
  onAddLiability: (record: Omit<LiabilityRecord, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateLiabilityPayment: (id: string, additionalPayment: number, autoLogExpense: boolean) => void;
  onDeleteLiability: (id: string) => void;
}

const CATEGORY_LABELS: Record<LiabilityCategory, string> = {
  rent: 'إيجار السكن/المحل',
  installment: 'أقساط (مكنة/موبايل/أجهزة)',
  jam3eya: 'جمعية شهرية',
  company: 'عجز تسوية شركة التوصيل',
  personal_debt: 'دين شخصي لأفراد',
  utility: 'فواتير وصيانة كبرى',
  other: 'التزام آخر',
};

export const LiabilitiesModule: React.FC<LiabilitiesModuleProps> = ({
  state,
  onAddLiability,
  onUpdateLiabilityPayment,
  onDeleteLiability,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLiabilityForPayment, setSelectedLiabilityForPayment] = useState<LiabilityRecord | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [autoLogExpenseChecked, setAutoLogExpenseChecked] = useState<boolean>(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');

  // Form state
  const [creditorName, setCreditorName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<LiabilityCategory>('installment');
  const [notes, setNotes] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTotal = parseFloat(totalAmount);
    const numPaid = parseFloat(paidAmount) || 0;
    if (isNaN(numTotal) || numTotal <= 0) return;
    if (!creditorName.trim()) return;

    onAddLiability({
      creditorName: creditorName.trim(),
      totalAmount: numTotal,
      paidAmount: Math.min(numPaid, numTotal),
      dueDate: dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      category,
      notes: notes.trim(),
    });

    // Reset
    setCreditorName('');
    setTotalAmount('');
    setPaidAmount('0');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLiabilityForPayment) return;
    const payment = parseFloat(paymentAmountInput);
    if (isNaN(payment) || payment <= 0) return;

    onUpdateLiabilityPayment(
      selectedLiabilityForPayment.id,
      payment,
      autoLogExpenseChecked
    );

    setSelectedLiabilityForPayment(null);
    setPaymentAmountInput('');
  };

  // Filter liabilities
  const filteredLiabilities = state.liabilities.filter((item) => {
    const matchesSearch =
      item.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRemainingLiabilities = state.liabilities.reduce((acc, curr) => {
    return acc + Math.max(0, curr.totalAmount - curr.paidAmount);
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">إدارة الديون والالتزامات (فلوس عليا)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجّل كل ديونك المستحقة (الإيجار، قسط المكنة، الجمعيات) وتتبع حالة السداد خطوة بخطوة
          </p>
        </div>

        <button
          id="btn-open-add-liability"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة التزام / دين جديد</span>
        </button>
      </div>

      {/* Filter and Total Summary Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="بحث باسم الدائن أو الجمعية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-amber-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل ({state.liabilities.length})
            </button>
            <button
              onClick={() => setStatusFilter('unpaid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'unpaid'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              غير مدفوع
            </button>
            <button
              onClick={() => setStatusFilter('partial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'partial'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              مدفوع جزئياً
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'paid'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              تم السداد بالكامل
            </button>
          </div>

        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>عدد التزامات المعروضة: {filteredLiabilities.length}</span>
          <span className="font-bold text-amber-700">
            إجمالي الديون المتبقية: {formatCurrency(totalRemainingLiabilities, state.currency)}
          </span>
        </div>
      </div>

      {/* Liabilities Grid/Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLiabilities.length > 0 ? (
          filteredLiabilities.map((item) => {
            const remaining = Math.max(0, item.totalAmount - item.paidAmount);
            const isPaid = item.status === 'paid' || remaining <= 0;
            const isPartial = item.status === 'partial' && remaining > 0;
            const progress = Math.min(100, Math.round((item.paidAmount / item.totalAmount) * 100));

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between space-y-4 transition ${
                  isPaid ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {CATEGORY_LABELS[item.category] || 'التزام'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{item.creditorName}</h4>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isPartial
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {isPaid ? 'تم السداد بالكامل ✓' : isPartial ? 'مدفوع جزئياً' : 'غير مدفوع'}
                    </span>
                  </div>

                  {/* Amounts Breakdown */}
                  <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">الإجمالي</span>
                      <span className="text-xs font-bold text-slate-800">
                        {formatCurrency(item.totalAmount, state.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">المدفوع</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {formatCurrency(item.paidAmount, state.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">المتبقي</span>
                      <span className={`text-xs font-bold ${remaining > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {formatCurrency(remaining, state.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                      <span>نسبة السداد:</span>
                      <span className="font-semibold text-slate-700">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isPaid ? 'bg-emerald-500' : 'bg-amber-500'
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
                    <span>تاريخ الاستحقاق: {formatDateArabic(item.dueDate)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isPaid && (
                      <button
                        onClick={() => {
                          setSelectedLiabilityForPayment(item);
                          setPaymentAmountInput(remaining.toString());
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        تسجيل دفعة / سداد
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteLiability(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="حذف الالتزام"
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
            <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">لا توجد ديون أو التزامات مسجلة.</p>
          </div>
        )}
      </div>

      {/* Add Liability Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">إضافة دين أو التزام جديد (فلوس عليا)</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم جهة الدين / الالتزام *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إيجار الشقة، قسط المكنة للمعرض، جمعية الشهر"
                  value={creditorName}
                  onChange={(e) => setCreditorName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">إجمالي مبلغ الدين (ج.م) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-amber-700 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المدفوع سابقاً (إن وجد)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs text-emerald-700 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تصنيف الالتزام</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LiabilityCategory)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-amber-500 outline-none bg-white"
                  >
                    <option value="installment">أقساط مكنة / موبايل</option>
                    <option value="rent">إيجار سكن / محل</option>
                    <option value="jam3eya">جمعية شهرية</option>
                    <option value="company">عجز تسوية شركة التوصيل</option>
                    <option value="personal_debt">دين شخصي لأحد المعارف</option>
                    <option value="utility">فواتير وصيانة كبرى</option>
                    <option value="other">التزام آخر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: دفعت 500 عربون والمتبقي قبل يوم 15"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition shadow-sm"
                >
                  حفظ الالتزام
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Payment / Settlement Modal */}
      {selectedLiabilityForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">تسجيل دفعة سداد دين</h3>
              </div>
              <button
                onClick={() => setSelectedLiabilityForPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">سداد لحساب:</div>
                <div className="text-sm font-bold text-slate-900">{selectedLiabilityForPayment.creditorName}</div>
                <div className="text-xs text-amber-700 font-semibold mt-1">
                  المتبقي الحالي: {formatCurrency(Math.max(0, selectedLiabilityForPayment.totalAmount - selectedLiabilityForPayment.paidAmount), state.currency)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ الذي ترغب في سداده الآن (ج.م) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <input
                  type="checkbox"
                  id="chk-log-expense"
                  checked={autoLogExpenseChecked}
                  onChange={(e) => setAutoLogExpenseChecked(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="chk-log-expense" className="text-xs text-emerald-900 font-semibold cursor-pointer">
                  تسجيل هذه الدفعة تلقائياً في قائمة المصروفات اليومية
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLiabilityForPayment(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-sm"
                >
                  تأكيد السداد وتحديث المتبقي
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
