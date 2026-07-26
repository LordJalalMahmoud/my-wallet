'use client';

import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  HandCoins,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Calculator,
  Calendar,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AppState } from '@/lib/types';
import { TabType } from './TabNavigation';
import { calculateFinancials, formatCurrency, formatDateArabic } from '@/lib/financeUtils';
import { NetGapCard } from './NetGapCard';

interface DashboardViewProps {
  state: AppState;
  setActiveTab: (tab: TabType) => void;
  onQuickAddIncome: () => void;
  onQuickAddExpense: () => void;
  onOpenCalculator: () => void;
  onOpenAiModal: () => void;
}

const EXPENSE_CATEGORY_NAMES: Record<string, string> = {
  order_upfront: 'عربون أوردرات',
  fuel: 'بنزين ووقود',
  bike_maintenance: 'صيانة المكنة',
  phone: 'شحن وموبايل',
  meals: 'وجبات الشيفت',
  home: 'مصاريف منزلية',
  other: 'أخرى',
};

const CHART_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  setActiveTab,
  onQuickAddIncome,
  onQuickAddExpense,
  onOpenCalculator,
  onOpenAiModal,
}) => {
  const { walletBalance, totalLiabilities, totalReceivables } = calculateFinancials(state);

  // Calculate totals
  const totalIncome = state.incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Prepare chart data for last 7 days with useMemo
  const dailyChartData = useMemo(() => {
    const dailyDataMap: Record<string, { date: string; income: number; expense: number }> = {};
    const todayISO = new Date().toISOString().split('T')[0];
    const baseDate = new Date(todayISO).getTime();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate - 86400000 * i).toISOString().split('T')[0];
      dailyDataMap[d] = {
        date: d.slice(5), // MM-DD
        income: 0,
        expense: 0,
      };
    }

    state.incomes.forEach((inc) => {
      if (dailyDataMap[inc.date]) {
        dailyDataMap[inc.date].income += inc.amount;
      }
    });

    state.expenses.forEach((exp) => {
      if (dailyDataMap[exp.date]) {
        dailyDataMap[exp.date].expense += exp.amount;
      }
    });

    return Object.values(dailyDataMap);
  }, [state.incomes, state.expenses]);

  // Prepare Expense Breakdown Pie Chart with useMemo
  const pieData = useMemo(() => {
    const expenseCatMap: Record<string, number> = {};
    state.expenses.forEach((exp) => {
      const label = EXPENSE_CATEGORY_NAMES[exp.category] || exp.category;
      expenseCatMap[label] = (expenseCatMap[label] || 0) + exp.amount;
    });

    return Object.entries(expenseCatMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [state.expenses]);

  // Combine recent activities
  const recentActivities = [
    ...state.incomes.map((i) => ({ ...i, type: 'income' as const })),
    ...state.expenses.map((e) => ({ ...e, type: 'expense' as const })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* 1. Primary Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Wallet Cash Balance */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">رصيد الكاش والمحفظة</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-bold tracking-tight ${walletBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(walletBalance, state.currency)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              (إجمالي المقبوضات – إجمالي المصروفات)
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">تحركات اليوم:</span>
            <span className="text-emerald-300 font-medium">نشط</span>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي المقبوضات</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalIncome, state.currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              من {state.incomes.length} عملية تحصيل وتيبس
            </p>
          </div>
          <button
            onClick={() => setActiveTab('income')}
            className="mt-4 pt-3 border-t border-slate-100 w-full flex justify-between items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <span>إدارة المقبوضات</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Total Liabilities ("فلوس عليا") */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">فلوس عليا (ديون)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-600">
              {formatCurrency(totalLiabilities, state.currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              التزامات قائمة لم تدفع بعد
            </p>
          </div>
          <button
            onClick={() => setActiveTab('liabilities')}
            className="mt-4 pt-3 border-t border-slate-100 w-full flex justify-between items-center text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            <span>جدول الديون والالتزامات</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Total Receivables ("فلوس ليا") */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">فلوس ليا (مستحقات)</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <HandCoins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalReceivables, state.currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              مبالغ متبقية لك لدى المطاعم والعملاء
            </p>
          </div>
          <button
            onClick={() => setActiveTab('receivables')}
            className="mt-4 pt-3 border-t border-slate-100 w-full flex justify-between items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>سجل المستحقات</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 2. "لسة محتاج" Financial Gap Card */}
      <NetGapCard state={state} onOpenAiAdvice={onOpenAiModal} />

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                مقارنة المقبوضات والمصروفات اليومية
              </h3>
              <p className="text-xs text-slate-500">آخر 7 أيام عمل</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  formatter={(val: any) => [`${val ?? 0} ${state.currency}`, '']}
                />
                <Bar dataKey="income" name="المقبوضات" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="المصروفات" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Category Pie Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
              توزيع المصروفات
            </h3>
            <p className="text-xs text-slate-500 mb-4">أين ذهبت نقودك؟</p>

            {pieData.length > 0 ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val ?? 0} ${state.currency}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                لا توجد مصروفات مسجلة بعد
              </div>
            )}
          </div>

          <div className="space-y-1 mt-2">
            {pieData.slice(0, 3).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  ></span>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(item.value, state.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Recent Transactions & Quick Shift Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-600" />
              آخر الحركات المالية
            </h3>
            <div className="flex gap-2">
              <button
                onClick={onQuickAddIncome}
                className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold px-2.5 py-1.5 rounded-lg transition"
              >
                + إضافة دخل
              </button>
              <button
                onClick={onQuickAddExpense}
                className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold px-2.5 py-1.5 rounded-lg transition"
              >
                + إضافة مصروف
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => {
                const isIncome = act.type === 'income';
                return (
                  <div key={act.id} className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          {isIncome ? (act as any).source : (act as any).description}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatDateArabic(act.date)}</span>
                          {act.notes && <span>• {act.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div className={`text-sm sm:text-base font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(act.amount, state.currency)}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">لا توجد حركات مسجلة بعد.</p>
            )}
          </div>
        </div>

        {/* Quick Shift Tools Widget */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">حاسبة تسوية الشيفت</h3>
                <p className="text-xs text-slate-400">حساب أرباح الأوردر فورياً بدون أخطاء</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              هل أنهيت شيفت العمل مع مطعم أو صيدلية؟ احسب صافي التحصيل بعد خصم مقدم الأوردر والإكراميات بسهولة.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={onOpenCalculator}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Calculator className="w-4 h-4" />
              <span>فتح حاسبة الأوردرات</span>
            </button>

            <button
              onClick={onOpenAiModal}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2.5 rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>استخراج العمليات بالذكاء الاصطناعي</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
