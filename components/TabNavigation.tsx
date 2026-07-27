'use client';

import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard,
  HandCoins,
  Target,
  Sparkles,
} from 'lucide-react';
import { AppState } from '@/lib/types';
import { calculateFinancials } from '@/lib/financeUtils';

export type TabType = 
  | 'dashboard' 
  | 'income' 
  | 'expenses' 
  | 'liabilities' 
  | 'receivables' 
  | 'goals' 
  | 'ai_tools';

interface TabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  state: AppState;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  state,
}) => {
  const { totalLiabilities, totalReceivables } = calculateFinancials(state);

  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'income' as TabType,
      label: 'المقبوضات والدخل',
      icon: TrendingUp,
      badge: state.incomes.length > 0 ? state.incomes.length : null,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'expenses' as TabType,
      label: 'المصروفات',
      icon: TrendingDown,
      badge: state.expenses.length > 0 ? state.expenses.length : null,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'liabilities' as TabType,
      label: 'فلوس عليا (ديون)',
      icon: CreditCard,
      badge: totalLiabilities > 0 ? `${totalLiabilities} ج.م` : null,
      badgeColor: 'bg-amber-100 text-amber-900 font-bold',
    },
    {
      id: 'receivables' as TabType,
      label: 'فلوس ليا (مستحقات)',
      icon: HandCoins,
      badge: totalReceivables > 0 ? `${totalReceivables} ج.م` : null,
      badgeColor: 'bg-blue-100 text-blue-900 font-bold',
    },
    {
      id: 'goals' as TabType,
      label: 'الأهداف المالية',
      icon: Target,
      badge: state.goals.filter(g => !g.isCompleted).length > 0 
        ? state.goals.filter(g => !g.isCompleted).length 
        : null,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'ai_tools' as TabType,
      label: 'حاسبة ومساعد الذكاء',
      icon: Sparkles,
      badge: 'جديد',
      badgeColor: 'bg-indigo-600 text-white font-bold',
    },
  ];

  return (
    <nav className="bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex space-x-1.5 space-x-reverse overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>

                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-emerald-500/30 text-emerald-200' : tab.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
