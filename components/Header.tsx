'use client';

import React, { useRef } from 'react';
import { Wallet, RefreshCw, Download, Upload, Sparkles, Calculator, PlusCircle, CloudCheck, UserCheck, LogOut, LogIn } from 'lucide-react';
import { AppState } from '@/lib/types';
import { calculateFinancials, formatCurrency } from '@/lib/financeUtils';
import { User } from 'firebase/auth';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

interface HeaderProps {
  state: AppState;
  user: User | null;
  isFirebaseLoading: boolean;
  onGoogleLogin: () => void;
  onLogout: () => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCalculator: () => void;
  onOpenAiModal: () => void;
  onQuickAddIncome: () => void;
  onQuickAddExpense: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  user,
  isFirebaseLoading,
  onGoogleLogin,
  onLogout,
  onResetData,
  onExportData,
  onImportData,
  onOpenCalculator,
  onOpenAiModal,
  onQuickAddIncome,
  onQuickAddExpense,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { walletBalance } = calculateFinancials(state);

  return (
    <header className="bg-slate-950/90 text-white border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
          {/* Logo & App Name */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>محفظتي</span>
                  <span className="text-[11px] font-normal bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CloudCheck className="w-3 h-3 text-emerald-400" />
                    <span>سحابي</span>
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  المحاسب المالي للمندوب
                </p>
              </div>
            </div>

            {/* Wallet quick balance on mobile */}
            <div className="md:hidden text-left bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-400 block">رصيد المحفظة</span>
              <span className={`text-xs font-bold ${walletBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(walletBalance, state.currency)}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-0.5 md:pb-0 scrollbar-none justify-start md:justify-end">
            
            {/* PWA Install Button */}
            <PwaInstallPrompt />

            {/* Quick Add Buttons */}
            <button
              id="btn-quick-add-income"
              onClick={onQuickAddIncome}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ إيراد</span>
            </button>

            <button
              id="btn-quick-add-expense"
              onClick={onQuickAddExpense}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ مصروف</span>
            </button>

            {/* Order Settlement Calculator */}
            <button
              id="btn-open-calc"
              onClick={onOpenCalculator}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-700 transition whitespace-nowrap"
              title="حاسبة تسوية الأوردرات السريعة"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">حاسبة الشيفت</span>
            </button>

            {/* Gemini AI Smart Assistant */}
            <button
              id="btn-open-ai"
              onClick={onOpenAiModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm whitespace-nowrap"
              title="المساعد الذكي وإدخال النصوص"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>المساعد الذكي</span>
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block"></div>

            {/* Firebase User Auth Button */}
            {user && !user.isAnonymous ? (
              <div className="flex items-center gap-1 bg-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[100px] truncate text-slate-200">{user.email || user.displayName || 'مستخدم'}</span>
                <button
                  onClick={onLogout}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded transition mr-1"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleLogin}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-700 transition whitespace-nowrap"
                title="ربط حسابك بـ Google لمزامنة البيانات عبر أجهزة متعدّدة"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ربط الحساب</span>
              </button>
            )}

            {/* Backup & Import & Reset */}
            <button
              id="btn-export-data"
              onClick={onExportData}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="تصدير نسخة احتياطية (JSON)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              id="btn-import-trigger"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="استرجاع نسخة احتياطية"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportData}
              accept=".json"
              className="hidden"
            />

            <button
              id="btn-reset-data"
              onClick={onResetData}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
              title="إعادة ضبط العينة التجريبية"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
