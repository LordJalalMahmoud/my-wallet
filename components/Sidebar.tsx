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
  UserCheck,
  LogOut,
  LogIn,
  Download,
  Upload,
  RefreshCw,
  Coins,
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
      badge: totalLiabilities > 0 ? `${totalLiabilities} ج.م` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold',
    },
    {
      id: 'receivables' as TabType,
      label: 'فلوس ليا (مستحقات)',
      icon: HandCoins,
      badge: totalReceivables > 0 ? `${totalReceivables} ج.م` : null,
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
      label: 'حاسبة الذكاء الاصطناعي',
      icon: Sparkles,
      badge: 'ذكاء',
      badgeColor: 'bg-indigo-600 text-white font-bold',
    },
  ];

  return (
    <aside className="w-64 xl:w-72 bg-slate-900 border-l border-slate-800 flex flex-col justify-between h-full text-slate-100 select-none dir-rtl shrink-0 z-30">
      
      {/* Top Header & App Branding */}
      <div className="p-4 space-y-4">
        
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30 shadow-inner">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>محفظتي</span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <CloudCheck className="w-3 h-3 text-emerald-400" />
                  <span>سحابي</span>
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">المحاسب المالي للمندوب</p>
            </div>
          </div>
        </div>

        {/* Realtime Wallet Balance Card */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-medium text-slate-400 block mb-0.5">رصيد المحفظة النقدي</span>
            <span className={`text-base font-bold ${walletBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(walletBalance, state.currency)}
            </span>
          </div>
          <button
            onClick={onToggleCurrency}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 text-[10px] font-bold transition flex items-center gap-1"
            title="تغيير العملة"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{state.currency}</span>
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onQuickAddIncome}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-2.5 rounded-xl transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ إيراد</span>
          </button>
          <button
            onClick={onQuickAddExpense}
            className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 px-2.5 rounded-xl transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ مصروف</span>
          </button>
        </div>

        {/* Secondary Tools Buttons */}
        <div className="space-y-1.5">
          <button
            onClick={onOpenCalculator}
            className="w-full flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700/80 transition"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>حاسبة تسوية الشيفت</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">سريع</span>
          </button>

          <button
            onClick={onOpenAiModal}
            className="w-full flex items-center justify-between bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-900/80 hover:to-purple-900/80 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-indigo-700/50 transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>المساعد الذكي (Gemini)</span>
            </div>
            <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/40">ذكاء</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="pt-2">
          <p className="text-[10px] font-bold text-slate-500 px-2 mb-2 uppercase tracking-wider">القوائم والأقسام</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border-r-4 border-emerald-500 bg-gradient-to-l from-emerald-500/10 to-transparent'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
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

      {/* Bottom Footer User & Backup Area */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
        
        {/* User Account Tile */}
        {user && !user.isAnonymous ? (
          <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user.displayName || user.email || 'مستخدم'}</p>
                <p className="text-[10px] text-emerald-400">متصل وسحابي ✓</p>
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
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-700 transition"
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
