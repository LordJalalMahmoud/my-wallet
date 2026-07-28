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
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Native Fintech Hero Header & Main Wallet Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500"></div>
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>تزامن مباشر | المندوب</span>
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-200 mt-2">
              أهلاً بك في المحفظة المالية الذكية
            </h1>
          </div>

          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-amber-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-amber-500/30 transition shadow-xs"
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>حاسبة التسوية السريعة</span>
          </button>
        </div>

        {/* Large Display Net Cash Balance */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <span className="text-xs font-medium text-slate-400 block mb-1">صافي الكاش المتاح بالمحفظة</span>
          <div className="flex items-baseline gap-3">
            <h2 className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-mono ${walletBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(walletBalance, state.currency)}
            </h2>
            <span className="text-xs text-slate-400 font-medium">(المقبوضات - المصروفات)</span>
          </div>
        </div>

        {/* Native Touch Action Buttons Row */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={onQuickAddIncome}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl transition shadow-md active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ تسجيل إيراد</span>
          </button>

          <button
            onClick={onQuickAddExpense}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl transition shadow-md active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ تسجيل مصروف</span>
          </button>

          <button
            onClick={onOpenAiModal}
            className="flex items-center justify-center gap-2 bg-indigo-900/60 hover:bg-indigo-900/80 text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl border border-indigo-700/50 transition shadow-md active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>المساعد الذكي</span>
          </button>

          <button
            onClick={() => setActiveTab('income')}
            className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-bold py-3 px-4 rounded-xl border border-slate-700/80 transition shadow-xs active:scale-95"
          >
            <BarChart3 className="w-4 h-4 text-teal-400" />
            <span>سجل المعاملات</span>
          </button>
        </div>
      </div>

      {/* 2. Seamless Flowing Financial Metrics Strip */}
      <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-emerald-400" />
            <span>الملخص المالي الشامل</span>
          </h3>
          <span className="text-[11px] text-slate-400">حسابات دقيقة ومحدّثة</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Income Summary */}
          <div
            onClick={() => setActiveTab('income')}
            className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-emerald-500/40 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 group-hover:text-emerald-400 transition">إجمالي المقبوضات</span>
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h4 className="text-xl font-bold text-emerald-400">
                {formatCurrency(totalIncome, state.currency)}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{state.incomes.length} عملية تحصيل</p>
            </div>
          </div>

          {/* Expense Summary */}
          <div
            onClick={() => setActiveTab('expenses')}
            className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-rose-500/40 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 group-hover:text-rose-400 transition">إجمالي المصروفات</span>
              <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h4 className="text-xl font-bold text-rose-400">
                {formatCurrency(totalExpense, state.currency)}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{state.expenses.length} عملية صرف</p>
            </div>
          </div>

          {/* Liabilities Summary */}
          <div
            onClick={() => setActiveTab('liabilities')}
            className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-amber-500/40 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 group-hover:text-amber-400 transition">فلوس عليا (ديون)</span>
              <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h4 className="text-xl font-bold text-amber-400">
                {formatCurrency(totalLiabilities, state.currency)}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">التزامات مستحقة</p>
            </div>
          </div>

          {/* Receivables Summary */}
          <div
            onClick={() => setActiveTab('receivables')}
            className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-blue-500/40 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 group-hover:text-blue-400 transition">فلوس ليا (مستحقات)</span>
              <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <HandCoins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h4 className="text-xl font-bold text-blue-400">
                {formatCurrency(totalReceivables, state.currency)}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">مبالغ خارجية لك</p>
            </div>
          </div>

        </div>
      </div>

      {/* 2. "لسة محتاج" Financial Gap Card */}
      <NetGapCard state={state} onOpenAiAdvice={onOpenAiModal} />

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-3xl p-6 border border-slate-800/80 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                مقارنة المقبوضات والمصروفات اليومية
              </h3>
              <p className="text-xs text-slate-400">آخر 7 أيام عمل</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                مقبوضات
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                مصروفات
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderRadius: '16px', border: '1px solid #1e293b', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}
                  formatter={(val: any) => [`${val ?? 0} ${state.currency}`, '']}
                />
                <Bar dataKey="income" name="المقبوضات" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="المصروفات" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Category Pie Chart */}
        <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800/80 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <PieChartIcon className="w-5 h-5 text-purple-400" />
              توزيع المصروفات
            </h3>
            <p className="text-xs text-slate-400 mb-4">تحليل أين ذهبت نقودك؟</p>

            {pieData.length > 0 ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderRadius: '16px', border: '1px solid #1e293b', color: '#fff' }}
                      formatter={(val: any) => [`${val ?? 0} ${state.currency}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-slate-500">
                لا توجد مصروفات مسجلة بعد
              </div>
            )}
          </div>

          <div className="space-y-1.5 mt-2">
            {pieData.slice(0, 3).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  ></span>
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-white">
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
        <div className="lg:col-span-2 bg-slate-900/80 rounded-3xl p-6 border border-slate-800/80 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                آخر الحركات المالية
              </h3>
              <p className="text-xs text-slate-400">سجل المعاملات السريعة والمقبوضات</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onQuickAddIncome}
                className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
              >
                + إيراد
              </button>
              <button
                onClick={onQuickAddExpense}
                className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
              >
                + مصروف
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => {
                const isIncome = act.type === 'income';
                return (
                  <div key={act.id} className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-2xl transition">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl ${isIncome ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                        {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white">
                          {isIncome ? (act as any).source : (act as any).description}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-400">{formatDateArabic(act.date)}</span>
                          {act.notes && <span className="truncate max-w-[150px] sm:max-w-xs">• {act.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div className={`text-sm sm:text-base font-extrabold font-mono ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(act.amount, state.currency)}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center">لا توجد حركات مسجلة بعد في محفظتك.</p>
            )}
          </div>
        </div>

        {/* Quick Shift Tools Widget */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 text-white rounded-3xl p-6 border border-slate-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shadow-inner">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">حاسبة تسوية الشيفت</h3>
                <p className="text-xs text-slate-400">حساب أرباح الأوردر فورياً</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              هل أنهيت شيفت العمل مع مطعم أو صيدلية؟ احسب صافي التحصيل بعد خصم مقدم الأوردر والإكراميات بسهولة.
            </p>
          </div>

          <div className="space-y-2.5 mt-2">
            <button
              onClick={onOpenCalculator}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Calculator className="w-4 h-4 text-slate-950" />
              <span>فتح حاسبة الأوردرات</span>
            </button>

            <button
              onClick={onOpenAiModal}
              className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-xs py-3 rounded-2xl border border-slate-700/80 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>استخراج العمليات بالذكاء الاصطناعي</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
