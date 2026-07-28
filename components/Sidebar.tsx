'use client';

import React, { useRef } from 'react';
import {
  Wallet,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard,
  HandCoins,
  Target,
  Sparkles,
  Calculator,
  PlusCircle,
  CloudCheck,
  LogOut,
  LogIn,
  Download,
  Upload,
  RefreshCw,
  Coins,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { TabType } from '@/components/TabNavigation';
import { AppState } from '@/lib/types';
import { calculateFinancials, formatCurrency } from '@/lib/financeUtils';
import { User } from 'firebase/auth';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  state: AppState;
  user: User | null;
  onGoogleLogin: () => void;
  onLogout: () => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCalculator: () => void;
  onOpenAiModal: () => void;
  onQuickAddIncome: () => void;
  onQuickAddExpense: () => void;
  onToggleCurrency: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  state,
  user,
  onGoogleLogin,
  onLogout,
  onResetData,
  onExportData,
  onImportData,
  onOpenCalculator,
  onOpenAiModal,
  onQuickAddIncome,
  onQuickAddExpense,
  onToggleCurrency,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { walletBalance, totalLiabilities, totalReceivables } = calculateFinancials(state);

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'الرئيسية (لوحة التحكم)',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'income' as TabType,
      label: 'المقبوضات والدخل',
      icon: TrendingUp,
      badge: state.incomes.length > 0 ? `${state.incomes.length}` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'expenses' as TabType,
      label: 'المصروفات اليومية',
      icon: TrendingDown,
      badge: state.expenses.length > 0 ? `${state.expenses.length}` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    {
      id: 'liabilities' as TabType,
      label: 'فلوس عليا (الديون)',
      icon: CreditCard,
      badge: totalLiabilities > 0 ? `${totalLiabilities} ${state.currency}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold',
    },
    {
      id: 'receivables' as TabType,
      label: 'فلوس ليا (مستحقات)',
      icon: HandCoins,
      badge: totalReceivables > 0 ? `${totalReceivables} ${state.currency}` : null,
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold',
    },
    {
      id: 'goals' as TabType,
      label: 'الأهداف المالية',
      icon: Target,
      badge: state.goals.filter((g) => !g.isCompleted).length > 0
        ? `${state.goals.filter((g) => !g.isCompleted).length}`
        : null,
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    },
    {
      id: 'ai_tools' as TabType,
      label: 'المساعد الذكي Gemini',
      icon: Sparkles,
      badge: 'ذكاء',
      badgeColor: 'bg-indigo-600 text-white font-bold animate-pulse',
    },
  ];

  return (
    <aside className="w-64 xl:w-72 bg-slate-950/95 border-l border-slate-800/80 flex flex-col justify-between h-full text-slate-100 select-none dir-rtl shrink-0 z-30 shadow-2xl backdrop-blur-xl">
      
      {/* Top Section & Navigation */}
      <div className="p-4 space-y-4 overflow-y-auto scrollbar-none">
        
        {/* Brand Logo & Status */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Wallet className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold tracking-tight text-white font-sans">
                  محفظتي <span className="text-emerald-400">Pro</span>
                </h1>
                <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">نظام المندوب السحابي</p>
            </div>
          </div>
        </div>

        {/* Realtime Wallet Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-4 rounded-2xl border border-slate-800/90 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">رصيد الكاش الحالي</span>
            <button
              onClick={onToggleCurrency}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-full border border-amber-500/30 text-[10px] font-bold transition flex items-center gap-1"
              title="تغيير العملة"
            >
              <Coins className="w-3 h-3 text-amber-400" />
              <span>{state.currency}</span>
            </button>
          </div>

          <div className="mt-1">
            <span className={`text-2xl font-black font-mono tracking-tight ${walletBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(walletBalance, state.currency)}
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              تزامن آمن
            </span>
            <span>محدّث الآن</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onQuickAddIncome}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-md active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ إيراد</span>
          </button>
          <button
            onClick={onQuickAddExpense}
            className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-md active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ مصروف</span>
          </button>
        </div>

        {/* Quick Shift Calc & AI */}
        <div className="space-y-1.5">
          <button
            onClick={onOpenCalculator}
            className="w-full flex items-center justify-between bg-slate-900 hover:bg-slate-800/90 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800/80 transition active:scale-98"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>حاسبة تسوية الشيفت</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/30">سريع</span>
          </button>

          <button
            onClick={onOpenAiModal}
            className="w-full flex items-center justify-between bg-gradient-to-r from-indigo-950 via-indigo-900/80 to-purple-950 hover:from-indigo-900 hover:to-purple-900 text-white text-xs font-semibold px-3 py-2.5 rounded-xl border border-indigo-700/50 transition active:scale-98 shadow-md"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>المساعد الذكي (Gemini)</span>
            </div>
            <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded-full border border-purple-500/40">AI</span>
          </button>
        </div>

        {/* Navigation Menu Links */}
        <div className="pt-2">
          <p className="text-[10px] font-bold text-slate-500 px-2 mb-2 uppercase tracking-wider">الأقسام المالية</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-150 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border-r-4 border-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Footer Area: User Profile & Controls */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950">
        
        {/* User Account Tile */}
        {user && !user.isAnonymous ? (
          <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user.displayName || user.email || 'مستخدم'}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  متصل وسحابي
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition shrink-0"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-800 transition"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول بـ Google</span>
          </button>
        )}

        {/* Data Tools Row */}
        <div className="flex items-center justify-between gap-1 text-slate-400 pt-1">
          <PwaInstallPrompt />

          <button
            onClick={onExportData}
            className="flex-1 flex items-center justify-center gap-1 p-2 text-[11px] bg-slate-900 hover:bg-slate-800 hover:text-white rounded-lg border border-slate-800 transition"
            title="تصدير نسخة احتياطية (JSON)"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>تصدير</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1 p-2 text-[11px] bg-slate-900 hover:bg-slate-800 hover:text-white rounded-lg border border-slate-800 transition"
            title="استيراد نسخة احتياطية"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>استيراد</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onImportData}
            className="hidden"
          />

          <button
            onClick={onResetData}
            className="p-2 text-[11px] bg-slate-900 hover:bg-rose-950 hover:text-rose-400 rounded-lg border border-slate-800 transition"
            title="تصفير البيانات"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </aside>
  );
};

