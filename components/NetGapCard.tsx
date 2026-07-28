'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, ArrowDownRight, ArrowUpRight, Calendar, AlertCircle, Info } from 'lucide-react';
import { AppState } from '@/lib/types';
import { calculateFinancials, formatCurrency } from '@/lib/financeUtils';

interface NetGapCardProps {
  state: AppState;
  onOpenAiAdvice?: () => void;
}

export const NetGapCard: React.FC<NetGapCardProps> = ({ state, onOpenAiAdvice }) => {
  const {
    walletBalance,
    totalLiabilities,
    totalReceivables,
    netGap,
    isSafe,
    surplus,
    daysToCoverGap,
  } = calculateFinancials(state);

  const coveredByCurrentAssets = walletBalance + totalReceivables;
  const coveragePercent = totalLiabilities > 0
    ? Math.min(100, Math.round((coveredByCurrentAssets / totalLiabilities) * 100))
    : 100;

  return (
    <div
      id="net-gap-card"
      className={`rounded-3xl border p-6 transition-all duration-300 shadow-xl backdrop-blur-xl ${
        isSafe
          ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-slate-950 text-white border-emerald-500/40 shadow-emerald-950/30'
          : 'bg-gradient-to-br from-slate-900/95 via-amber-950/40 to-slate-950 text-white border-amber-500/40 shadow-amber-950/30'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Header Status Badge */}
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-center shadow-lg ${
              isSafe
                ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-emerald-500/20'
                : 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 shadow-amber-500/20'
            }`}
          >
            {isSafe ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <ShieldAlert className="w-8 h-8" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                مؤشر الفجوة المالية الحقيقية
              </span>
              <span
                className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${
                  isSafe
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isSafe ? 'أمان مالي 🎉' : 'لسة محتاج عمل'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1 text-white">
              {isSafe ? (
                <span className="text-emerald-400">
                  فائض صافي: {formatCurrency(surplus, state.currency)}
                </span>
              ) : (
                <span className="text-amber-400">
                  لسة محتاج: {formatCurrency(netGap, state.currency)}
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              {isSafe
                ? 'سيولتك الحالية ومستحقاتك الخارجية تغطي جميع ديونك والتزاماتك القادمة وزيادة!'
                : 'المبلغ المتبقي الفعلي المترتب عليك لتصفية كامل الديون بعد احتساب المحفظة والمستحقات.'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {onOpenAiAdvice && (
          <button
            id="btn-ai-advice-gap"
            onClick={onOpenAiAdvice}
            className="w-full md:w-auto bg-slate-800/90 hover:bg-slate-800 text-white text-xs font-bold px-4 py-3 rounded-2xl border border-slate-700/80 transition flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 shadow-md"
          >
            <Info className="w-4 h-4 text-amber-300" />
            <span>خطة المساعد الذكي لسداد الفجوة</span>
          </button>
        )}
      </div>

      {/* Progress Bar & Equation Breakdown */}
      <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Step 1: Liabilities */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>1. إجمالي الديون (فلوس عليا)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-black font-mono text-rose-400">
            {formatCurrency(totalLiabilities, state.currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            إيجار، أقساط، جمعيات، وغيرها
          </div>
        </div>

        {/* Step 2: Liquid Assets (Wallet + Receivables) */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>2. المحفظة + المستحقات (فلوس ليا)</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-400">
            {formatCurrency(coveredByCurrentAssets, state.currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {formatCurrency(walletBalance, state.currency)} كاش + {formatCurrency(totalReceivables, state.currency)} مستحق
          </div>
        </div>

        {/* Step 3: Shift Days Forecast */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>3. التغطية المتوقعة بالشفتات</span>
            <Calendar className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-xl font-black font-mono text-amber-300">
            {isSafe ? '0 أيام (مغطى)' : `${daysToCoverGap} شيفت يومي`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            بمعدل إيراد صافي {state.dailyTargetEarnings || 350} {state.currency}/يوم
          </div>
        </div>

      </div>

      {/* Coverage Progress Bar */}
      <div className="mt-5">
        <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
          <span className="text-slate-300">نسبة تغطية الديون والالتزامات الحالية:</span>
          <span className="text-emerald-400 font-mono">{coveragePercent}%</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isSafe ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
            }`}
            style={{ width: `${coveragePercent}%` }}
          ></div>
        </div>
      </div>

    </div>
  );
};
