'use client';

import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { TabType } from './TabNavigation';
import { AppState } from '@/lib/types';
import { calculateFinancials } from '@/lib/financeUtils';

interface MobileBottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenCalculator: () => void;
  state: AppState;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenCalculator,
  state,
}) => {
  const { totalLiabilities } = calculateFinancials(state);

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'الرئيسية',
      icon: LayoutDashboard,
    },
    {
      id: 'income' as TabType,
      label: 'إيراد',
      icon: TrendingUp,
    },
    {
      id: 'expenses' as TabType,
      label: 'مصروف',
      icon: TrendingDown,
    },
    {
      id: 'liabilities' as TabType,
      label: 'ديون',
      icon: CreditCard,
      badge: totalLiabilities > 0,
    },
    {
      id: 'ai_tools' as TabType,
      label: 'الذكاء',
      icon: Sparkles,
      highlight: true,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-50">
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 text-white rounded-2xl px-2 py-2 shadow-2xl shadow-emerald-950/40 flex items-center justify-between max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/15 font-bold scale-105 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${item.highlight && !isActive ? 'text-indigo-400' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                )}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Quick Shift Calc Button */}
        <button
          id="mobile-nav-calc"
          onClick={onOpenCalculator}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md active:scale-95 transition"
        >
          <Calculator className="w-5 h-5 text-slate-950" />
          <span className="text-[10px] mt-0.5">حاسبة</span>
        </button>
      </div>
    </div>
  );
};

