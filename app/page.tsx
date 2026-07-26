'use client';

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AppState, IncomeRecord, ExpenseRecord, LiabilityRecord, ReceivableRecord, FinancialGoal } from '@/lib/types';
import { initialSampleData } from '@/lib/sampleData';
import {
  subscribeToAuth,
  subscribeToUserData,
  addFirestoreDoc,
  updateFirestoreDoc,
  deleteFirestoreDoc,
  loginWithGoogle,
  logoutUser,
  clearAllUserData,
} from '@/lib/firebase';
import { Header } from '@/components/Header';
import { TabNavigation, TabType } from '@/components/TabNavigation';
import { DashboardView } from '@/components/DashboardView';
import { IncomeModule } from '@/components/IncomeModule';
import { ExpenseModule } from '@/components/ExpenseModule';
import { LiabilitiesModule } from '@/components/LiabilitiesModule';
import { ReceivablesModule } from '@/components/ReceivablesModule';
import { GoalsModule } from '@/components/GoalsModule';
import { AiToolsTab } from '@/components/AiToolsTab';
import { OrderCalculatorModal } from '@/components/OrderCalculatorModal';
import { AiAssistantModal } from '@/components/AiAssistantModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LoginScreen } from '@/components/LoginScreen';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  const [state, setState] = useState<AppState>(initialSampleData);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Modals
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [incomeAddInitiallyOpen, setIncomeAddInitiallyOpen] = useState(false);
  const [expenseAddInitiallyOpen, setExpenseAddInitiallyOpen] = useState(false);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubAuth = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setIsFirebaseLoading(false);
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to Firestore Realtime Updates when User is Authenticated
  useEffect(() => {
    if (!user) return;

    const unsubData = subscribeToUserData(user.uid, (partialData) => {
      setState((prev) => ({
        ...prev,
        ...partialData,
      }));
    });

    return () => unsubData();
  }, [user]);

  // Firebase Handlers
  const handleAddIncome = async (income: Omit<IncomeRecord, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addFirestoreDoc('incomes', user.uid, income);
    } catch (err) {
      console.error('Error adding income to Firestore:', err);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      await deleteFirestoreDoc('incomes', id);
    } catch (err) {
      console.error('Error deleting income:', err);
    }
  };

  const handleAddExpense = async (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addFirestoreDoc('expenses', user.uid, expense);
    } catch (err) {
      console.error('Error adding expense to Firestore:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteFirestoreDoc('expenses', id);
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const handleAddLiability = async (liability: Omit<LiabilityRecord, 'id' | 'createdAt' | 'status'>) => {
    if (!user) return;
    const remaining = Math.max(0, liability.totalAmount - liability.paidAmount);
    const status: LiabilityRecord['status'] = remaining <= 0 ? 'paid' : liability.paidAmount > 0 ? 'partial' : 'unpaid';

    try {
      await addFirestoreDoc('liabilities', user.uid, {
        ...liability,
        status,
      });
    } catch (err) {
      console.error('Error adding liability to Firestore:', err);
    }
  };

  const handleUpdateLiabilityPayment = async (id: string, additionalPayment: number, autoLogExpense: boolean) => {
    if (!user) return;
    const item = state.liabilities.find((l) => l.id === id);
    if (!item) return;

    const newPaid = Math.min(item.totalAmount, item.paidAmount + additionalPayment);
    const remaining = Math.max(0, item.totalAmount - newPaid);
    const status: LiabilityRecord['status'] = remaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    try {
      await updateFirestoreDoc('liabilities', id, {
        paidAmount: newPaid,
        status,
      });

      if (autoLogExpense && additionalPayment > 0) {
        await addFirestoreDoc('expenses', user.uid, {
          amount: additionalPayment,
          description: `سداد جزء/كامل دين: ${item.creditorName || 'الالتزام'}`,
          category: 'other',
          date: new Date().toISOString().split('T')[0],
          notes: 'سداد دين تلقائي',
        });
      }
    } catch (err) {
      console.error('Error updating liability payment:', err);
    }
  };

  const handleDeleteLiability = async (id: string) => {
    try {
      await deleteFirestoreDoc('liabilities', id);
    } catch (err) {
      console.error('Error deleting liability:', err);
    }
  };

  const handleAddReceivable = async (receivable: Omit<ReceivableRecord, 'id' | 'createdAt' | 'status'>) => {
    if (!user) return;
    const remaining = Math.max(0, receivable.totalAmount - receivable.collectedAmount);
    const status: ReceivableRecord['status'] = remaining <= 0 ? 'collected' : receivable.collectedAmount > 0 ? 'partial' : 'pending';

    try {
      await addFirestoreDoc('receivables', user.uid, {
        ...receivable,
        status,
      });
    } catch (err) {
      console.error('Error adding receivable to Firestore:', err);
    }
  };

  const handleUpdateReceivableCollection = async (id: string, additionalCollection: number, autoLogIncome: boolean) => {
    if (!user) return;
    const item = state.receivables.find((r) => r.id === id);
    if (!item) return;

    const newCollected = Math.min(item.totalAmount, item.collectedAmount + additionalCollection);
    const remaining = Math.max(0, item.totalAmount - newCollected);
    const status: ReceivableRecord['status'] = remaining <= 0 ? 'collected' : newCollected > 0 ? 'partial' : 'pending';

    try {
      await updateFirestoreDoc('receivables', id, {
        collectedAmount: newCollected,
        status,
      });

      if (autoLogIncome && additionalCollection > 0) {
        await addFirestoreDoc('incomes', user.uid, {
          amount: additionalCollection,
          source: `تحصيل مستحق: ${item.debtorName || 'الجهة المدينة'}`,
          category: 'orders',
          date: new Date().toISOString().split('T')[0],
          notes: 'تحصيل مستحق تلقائي',
        });
      }
    } catch (err) {
      console.error('Error updating receivable collection:', err);
    }
  };

  const handleDeleteReceivable = async (id: string) => {
    try {
      await deleteFirestoreDoc('receivables', id);
    } catch (err) {
      console.error('Error deleting receivable:', err);
    }
  };

  const handleAddGoal = async (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'isCompleted'>) => {
    if (!user) return;
    const remaining = Math.max(0, goal.targetAmount - goal.currentSavedAmount);
    try {
      await addFirestoreDoc('goals', user.uid, {
        ...goal,
        isCompleted: remaining <= 0,
      });
    } catch (err) {
      console.error('Error adding goal to Firestore:', err);
    }
  };

  const handleUpdateGoalSavings = async (id: string, newSavedAmount: number) => {
    const item = state.goals.find((g) => g.id === id);
    if (!item) return;

    const clamped = Math.min(item.targetAmount, newSavedAmount);
    try {
      await updateFirestoreDoc('goals', id, {
        currentSavedAmount: clamped,
        isCompleted: clamped >= item.targetAmount,
      });
    } catch (err) {
      console.error('Error updating goal savings:', err);
    }
  };

  const handleToggleGoalComplete = async (id: string) => {
    const item = state.goals.find((g) => g.id === id);
    if (!item) return;

    try {
      await updateFirestoreDoc('goals', id, {
        isCompleted: !item.isCompleted,
      });
    } catch (err) {
      console.error('Error toggling goal complete:', err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteFirestoreDoc('goals', id);
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  const handleAddParsedData = async (data: {
    incomes: Array<Omit<IncomeRecord, 'id' | 'createdAt'>>;
    expenses: Array<Omit<ExpenseRecord, 'id' | 'createdAt'>>;
    liabilities: Array<Omit<LiabilityRecord, 'id' | 'createdAt' | 'status'>>;
    receivables: Array<Omit<ReceivableRecord, 'id' | 'createdAt' | 'status'>>;
  }) => {
    for (const inc of data.incomes) await handleAddIncome(inc);
    for (const exp of data.expenses) await handleAddExpense(exp);
    for (const liab of data.liabilities) await handleAddLiability(liab);
    for (const rec of data.receivables) await handleAddReceivable(rec);
  };

  const handleResetData = async () => {
    if (!user) return;
    if (confirm('هل أنت تأكد من مسح كافة بيانات الحساب الحالية من قواعد بيانات Firebase؟')) {
      try {
        await clearAllUserData(user.uid);
      } catch (err) {
        console.error('Error clearing Firebase data:', err);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mahfazti_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed) {
          if (Array.isArray(parsed.incomes)) {
            for (const item of parsed.incomes) await handleAddIncome(item);
          }
          if (Array.isArray(parsed.expenses)) {
            for (const item of parsed.expenses) await handleAddExpense(item);
          }
          if (Array.isArray(parsed.liabilities)) {
            for (const item of parsed.liabilities) await handleAddLiability(item);
          }
          if (Array.isArray(parsed.receivables)) {
            for (const item of parsed.receivables) await handleAddReceivable(item);
          }
          if (Array.isArray(parsed.goals)) {
            for (const item of parsed.goals) await handleAddGoal(item);
          }
          alert('تم استيراد النسخة الاحتياطية بنجاح إلى Firebase!');
        } else {
          alert('ملف غير صالح.');
        }
      } catch {
        alert('حدث خطأ في قراءة الملف.');
      }
    };
    reader.readAsText(file);
  };

  // If checking Firebase auth status
  if (isFirebaseLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center dir-rtl">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">جاري المزامنة مع Firebase...</p>
      </div>
    );
  }

  // Mandatory Google Login Screen
  if (!user || user.isAnonymous) {
    return <LoginScreen onGoogleLogin={handleGoogleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-16">
      
      {/* Top App Header */}
      <Header
        state={state}
        user={user}
        isFirebaseLoading={isFirebaseLoading}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onQuickAddIncome={() => {
          setActiveTab('income');
          setIncomeAddInitiallyOpen(true);
        }}
        onQuickAddExpense={() => {
          setActiveTab('expenses');
          setExpenseAddInitiallyOpen(true);
        }}
      />

      {/* Main Tab Bar Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} state={state} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            state={state}
            setActiveTab={setActiveTab}
            onQuickAddIncome={() => {
              setActiveTab('income');
              setIncomeAddInitiallyOpen(true);
            }}
            onQuickAddExpense={() => {
              setActiveTab('expenses');
              setExpenseAddInitiallyOpen(true);
            }}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
            onOpenAiModal={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'income' && (
          <IncomeModule
            state={state}
            onAddIncome={handleAddIncome}
            onDeleteIncome={handleDeleteIncome}
            isAddModalOpenInitially={incomeAddInitiallyOpen}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseModule
            state={state}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            isAddModalOpenInitially={expenseAddInitiallyOpen}
          />
        )}

        {activeTab === 'liabilities' && (
          <LiabilitiesModule
            state={state}
            onAddLiability={handleAddLiability}
            onUpdateLiabilityPayment={handleUpdateLiabilityPayment}
            onDeleteLiability={handleDeleteLiability}
          />
        )}

        {activeTab === 'receivables' && (
          <ReceivablesModule
            state={state}
            onAddReceivable={handleAddReceivable}
            onUpdateReceivableCollection={handleUpdateReceivableCollection}
            onDeleteReceivable={handleDeleteReceivable}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsModule
            state={state}
            onAddGoal={handleAddGoal}
            onUpdateGoalSavings={handleUpdateGoalSavings}
            onToggleGoalComplete={handleToggleGoalComplete}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === 'ai_tools' && (
          <AiToolsTab
            state={state}
            onAddParsedData={handleAddParsedData}
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
          />
        )}
      </main>

      {/* Quick Shift Order Calculator Modal */}
      <OrderCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onAddIncome={handleAddIncome}
        onAddExpense={handleAddExpense}
        currency={state.currency}
      />

      {/* Gemini AI Smart Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        state={state}
        onAddParsedData={handleAddParsedData}
      />

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        state={state}
      />

    </div>
  );
}
