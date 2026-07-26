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
      badge: totalLiabilities > 0 ? true : false,
    },
    {
      id: 'ai_tools' as TabType,
      label: 'الذكاء',
      icon: Sparkles,
      highlight: true,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition min-w-[56px] min-h-[48px] ${
                isActive
                  ? 'text-emerald-400 bg-slate-800/80 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
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
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Quick Shift Calc Button */}
        <button
          id="mobile-nav-calc"
          onClick={onOpenCalculator}
          className="flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold min-w-[56px] min-h-[48px] shadow-sm active:scale-95 transition"
        >
          <Calculator className="w-5 h-5 text-slate-950" />
          <span className="text-[10px] mt-0.5">الحاسبة</span>
        </button>
      </div>
    </div>
  );
};
