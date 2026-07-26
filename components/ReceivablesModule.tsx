'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Calendar,
  HandCoins,
  X,
  CheckCircle2,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { AppState, ReceivableCategory, ReceivableRecord } from '@/lib/types';
import { formatCurrency, formatDateArabic } from '@/lib/financeUtils';

interface ReceivablesModuleProps {
  state: AppState;
  onAddReceivable: (record: Omit<ReceivableRecord, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateReceivableCollection: (id: string, additionalCollection: number, autoLogIncome: boolean) => void;
  onDeleteReceivable: (id: string) => void;
}

const CATEGORY_LABELS: Record<ReceivableCategory, string> = {
  restaurant: 'مطعم / صيدلية (باقي تحصيل)',
  client: 'عميل (أوردر آجل / تحويل فودافون كاش)',
  company: 'شركة التوصيل / المنصة (بونص ومستحقات)',
  friend: 'زميل / معارف',
  other: 'مستحق آخر',
};

export const ReceivablesModule: React.FC<ReceivablesModuleProps> = ({
  state,
  onAddReceivable,
  onUpdateReceivableCollection,
  onDeleteReceivable,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReceivableForCollection, setSelectedReceivableForCollection] = useState<ReceivableRecord | null>(null);
  const [collectionAmountInput, setCollectionAmountInput] = useState<string>('');
  const [autoLogIncomeChecked, setAutoLogIncomeChecked] = useState<boolean>(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'collected'>('all');

  // Form state
  const [debtorName, setDebtorName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [collectedAmount, setCollectedAmount] = useState('0');
  const [expectedDate, setExpectedDate] = useState('');
  const [category, setCategory] = useState<ReceivableCategory>('restaurant');
  const [notes, setNotes] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTotal = parseFloat(totalAmount);
    const numCollected = parseFloat(collectedAmount) || 0;
    if (isNaN(numTotal) || numTotal <= 0) return;
    if (!debtorName.trim()) return;

    onAddReceivable({
      debtorName: debtorName.trim(),
      totalAmount: numTotal,
      collectedAmount: Math.min(numCollected, numTotal),
      expectedDate: expectedDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      category,
      notes: notes.trim(),
    });

    // Reset
    setDebtorName('');
    setTotalAmount('');
    setCollectedAmount('0');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const handleCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivableForCollection) return;
    const collection = parseFloat(collectionAmountInput);
    if (isNaN(collection) || collection <= 0) return;

    onUpdateReceivableCollection(
      selectedReceivableForCollection.id,
      collection,
      autoLogIncomeChecked
    );

    setSelectedReceivableForCollection(null);
    setCollectionAmountInput('');
  };

  const filteredReceivables = state.receivables.filter((item) => {
    const matchesSearch =
      item.debtorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRemainingReceivables = state.receivables.reduce((acc, curr) => {
    return acc + Math.max(0, curr.totalAmount - curr.collectedAmount);
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <HandCoins className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">إدارة المستحقات الخارجية (فلوس ليا)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجّل مستحقاتك لدى المطاعم، العملاء، وشركات التوصيل وتتبع تحصيلها أولاً بأول
          </p>
        </div>

        <button
          id="btn-open-add-receivable"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مستحق جديد</span>
        </button>
      </div>

      {/* Filter and Summary */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="بحث باسم المطعم أو العميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 outline-none transition"
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
              الكل ({state.receivables.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              معلق
            </button>
            <button
              onClick={() => setStatusFilter('partial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'partial'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              مُحصل جزئياً
            </button>
            <button
              onClick={() => setStatusFilter('collected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'collected'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              تم التحصيل بالكامل
            </button>
          </div>

        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>عدد المستحقات المعروضة: {filteredReceivables.length}</span>
          <span className="font-bold text-blue-700">
            إجمالي المستحقات المتبقية: {formatCurrency(totalRemainingReceivables, state.currency)}
          </span>
        </div>
      </div>

      {/* Receivables List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReceivables.length > 0 ? (
          filteredReceivables.map((item) => {
            const remaining = Math.max(0, item.totalAmount - item.collectedAmount);
            const isCollected = item.status === 'collected' || remaining <= 0;
            const isPartial = item.status === 'partial' && remaining > 0;
            const progress = Math.min(100, Math.round((item.collectedAmount / item.totalAmount) * 100));

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between space-y-4 transition ${
                  isCollected ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {CATEGORY_LABELS[item.category] || 'مستحق'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{item.debtorName}</h4>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        isCollected
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isPartial
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {isCollected ? 'تم التحصيل بالكامل ✓' : isPartial ? 'مُحصل جزئياً' : 'في الانتظار'}
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
                      <span className="text-[10px] text-slate-400 block">المُحصل</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {formatCurrency(item.collectedAmount, state.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">المتبقي</span>
                      <span className={`text-xs font-bold ${remaining > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                        {formatCurrency(remaining, state.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                      <span>نسبة التحصيل:</span>
                      <span className="font-semibold text-slate-700">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCollected ? 'bg-emerald-500' : 'bg-blue-500'
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
                    <span>تاريخ التحصيل المتوقع: {formatDateArabic(item.expectedDate)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCollected && (
                      <button
                        onClick={() => {
                          setSelectedReceivableForCollection(item);
                          setCollectionAmountInput(remaining.toString());
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        تسجيل تحصيل
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteReceivable(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="حذف المستحق"
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
            <HandCoins className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">لا توجد مستحقات مسجلة.</p>
          </div>
        )}
      </div>

      {/* Add Receivable Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">إضافة مستحق جديد (فلوس ليا)</h3>
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
                  اسم الشخص / المطعم / الجهة المدينة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مطعم الشبراوي، عميل التجمع، شركة طلبات"
                  value={debtorName}
                  onChange={(e) => setDebtorName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">إجمالي المبلغ المستحق (ج.م) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-blue-700 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المحصل سابقاً (إن وجد)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={collectedAmount}
                    onChange={(e) => setCollectedAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs text-emerald-700 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تصنيف المستحق</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ReceivableCategory)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="restaurant">مطعم / صيدلية</option>
                    <option value="client">عميل (أوردر آجل)</option>
                    <option value="company">شركة التوصيل / بونص</option>
                    <option value="friend">زميل / معارف</option>
                    <option value="other">مستحق آخر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التحصيل المتوقع</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: تحويل فودافون كاش غداً صبيحة الشيفت"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-blue-500 outline-none"
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
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-sm"
                >
                  حفظ المستحق
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Collection Settlement Modal */}
      {selectedReceivableForCollection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">تسجيل تحصيل مبلغ مستحق</h3>
              </div>
              <button
                onClick={() => setSelectedReceivableForCollection(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectionSubmit} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">تحصيل لحساب:</div>
                <div className="text-sm font-bold text-slate-900">{selectedReceivableForCollection.debtorName}</div>
                <div className="text-xs text-blue-700 font-semibold mt-1">
                  المتبقي المستحق حالياً: {formatCurrency(Math.max(0, selectedReceivableForCollection.totalAmount - selectedReceivableForCollection.collectedAmount), state.currency)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المحصل الآن (ج.م) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={collectionAmountInput}
                  onChange={(e) => setCollectionAmountInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl border border-blue-200">
                <input
                  type="checkbox"
                  id="chk-log-income"
                  checked={autoLogIncomeChecked}
                  onChange={(e) => setAutoLogIncomeChecked(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="chk-log-income" className="text-xs text-blue-900 font-semibold cursor-pointer">
                  تسجيل هذا المبلغ تلقائياً كإيراد/مقبوضات نقدية في المحفظة
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReceivableForCollection(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-sm"
                >
                  تأكيد التحصيل وتحديث الرصيد
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
