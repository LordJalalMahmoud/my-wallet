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
import { Sidebar } from '@/components/Sidebar';
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

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Firebase Handlers with Optimistic UI updates
  const handleAddIncome = async (income: Omit<IncomeRecord, 'id' | 'createdAt'>) => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً بحساب Google لحفظ البيانات.');
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const newRecord: IncomeRecord = {
      ...income,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    // Optimistic Update
    setState((prev) => ({
      ...prev,
      incomes: [newRecord, ...prev.incomes],
    }));
    showToast('تم حفظ المقبوضات بنجاح وفي انتظار المزامنة...');

    try {
      await addFirestoreDoc('incomes', user.uid, income);
      showToast('تم حفظ المقبوضات بنجاح في Firebase ✓');
    } catch (err) {
      console.error('Error adding income to Firestore:', err);
      showToast('حدث خطأ أثناء الحفظ في قواعد البيانات!');
    }
  };

  const handleDeleteIncome = async (id: string) => {
    // Optimistic Update
    const previousIncomes = state.incomes;
    setState((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((item) => item.id !== id),
    }));
    showToast('تم حذف السجل.');

    try {
      if (!id.startsWith('temp-')) {
        await deleteFirestoreDoc('incomes', id);
      }
    } catch (err) {
      console.error('Error deleting income:', err);
      setState((prev) => ({ ...prev, incomes: previousIncomes }));
      showToast('فشل حذف السجل من Firebase');
    }
  };

  const handleAddExpense = async (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً لحفظ المصروفات.');
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const newRecord: ExpenseRecord = {
      ...expense,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    // Optimistic Update
    setState((prev) => ({
      ...prev,
      expenses: [newRecord, ...prev.expenses],
    }));
    showToast('تم تسجيل المصروف بنجاح...');

    try {
      await addFirestoreDoc('expenses', user.uid, expense);
      showToast('تم حفظ المصروف بنجاح في Firebase ✓');
    } catch (err) {
      console.error('Error adding expense to Firestore:', err);
      showToast('حدث خطأ أثناء حفظ المصروف!');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const previousExpenses = state.expenses;
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((item) => item.id !== id),
    }));
    showToast('تم حذف المصروف.');

    try {
      if (!id.startsWith('temp-')) {
        await deleteFirestoreDoc('expenses', id);
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      setState((prev) => ({ ...prev, expenses: previousExpenses }));
      showToast('فشل حذف المصروف');
    }
  };

  const handleAddLiability = async (liability: Omit<LiabilityRecord, 'id' | 'createdAt' | 'status'>) => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً لحفظ الدين.');
      return;
    }
    const remaining = Math.max(0, liability.totalAmount - liability.paidAmount);
    const status: LiabilityRecord['status'] = remaining <= 0 ? 'paid' : liability.paidAmount > 0 ? 'partial' : 'unpaid';

    const tempId = `temp-${Date.now()}`;
    const newRecord: LiabilityRecord = {
      ...liability,
      id: tempId,
      status,
      createdAt: new Date().toISOString(),
    };

    // Optimistic Update
    setState((prev) => ({
      ...prev,
      liabilities: [newRecord, ...prev.liabilities],
    }));
    showToast('تم تسجيل الدين/الالتزام بنجاح...');

    try {
      await addFirestoreDoc('liabilities', user.uid, {
        ...liability,
        status,
      });
      showToast('تم حفظ الدين بنجاح في Firebase ✓');
    } catch (err) {
      console.error('Error adding liability to Firestore:', err);
      showToast('حدث خطأ أثناء إضافة الدين!');
    }
  };

  const handleUpdateLiabilityPayment = async (id: string, additionalPayment: number, autoLogExpense: boolean) => {
    if (!user) return;
    const item = state.liabilities.find((l) => l.id === id);
    if (!item) return;

    const newPaid = Math.min(item.totalAmount, item.paidAmount + additionalPayment);
    const remaining = Math.max(0, item.totalAmount - newPaid);
    const status: LiabilityRecord['status'] = remaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    // Optimistic Update
    setState((prev) => ({
      ...prev,
      liabilities: prev.liabilities.map((l) => (l.id === id ? { ...l, paidAmount: newPaid, status } : l)),
    }));
    showToast('تم تحديث سداد الدين بنجاح ✓');

    try {
      if (!id.startsWith('temp-')) {
        await updateFirestoreDoc('liabilities', id, {
          paidAmount: newPaid,
          status,
        });
      }

      if (autoLogExpense && additionalPayment > 0) {
        await handleAddExpense({
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
    const previousLiabilities = state.liabilities;
    setState((prev) => ({
      ...prev,
      liabilities: prev.liabilities.filter((item) => item.id !== id),
    }));
    showToast('تم حذف الالتزام.');

    try {
      if (!id.startsWith('temp-')) {
        await deleteFirestoreDoc('liabilities', id);
      }
    } catch (err) {
      console.error('Error deleting liability:', err);
      setState((prev) => ({ ...prev, liabilities: previousLiabilities }));
    }
  };

  const handleAddReceivable = async (receivable: Omit<ReceivableRecord, 'id' | 'createdAt' | 'status'>) => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً لحفظ المستحق.');
      return;
    }
    const remaining = Math.max(0, receivable.totalAmount - receivable.collectedAmount);
    const status: ReceivableRecord['status'] = remaining <= 0 ? 'collected' : receivable.collectedAmount > 0 ? 'partial' : 'pending';

    const tempId = `temp-${Date.now()}`;
    const newRecord: ReceivableRecord = {
      ...receivable,
      id: tempId,
      status,
      createdAt: new Date().toISOString(),
    };

    // Optimistic Update
    setState((prev) => ({
      ...prev,
      receivables: [newRecord, ...prev.receivables],
    }));
    showToast('تم إضافة المبلغ المستحق بنجاح...');

    try {
      await addFirestoreDoc('receivables', user.uid, {
        ...receivable,
        status,
      });
      showToast('تم حفظ المبلغ المستحق في Firebase ✓');
    } catch (err) {
      console.error('Error adding receivable to Firestore:', err);
      showToast('حدث خطأ أثناء إضافة المستحق!');
    }
  };

  const handleUpdateReceivableCollection = async (id: string, additionalCollection: number, autoLogIncome: boolean) => {
    if (!user) return;
    const item = state.receivables.find((r) => r.id === id);
    if (!item) return;

    const newCollected = Math.min(item.totalAmount, item.collectedAmount + additionalCollection);
    const remaining = Math.max(0, item.totalAmount - newCollected);
    const status: ReceivableRecord['status'] = remaining <= 0 ? 'collected' : newCollected > 0 ? 'partial' : 'pending';

    // Optimistic Update
    setState((prev) => ({
      ...prev,
      receivables: prev.receivables.map((r) => (r.id === id ? { ...r, collectedAmount: newCollected, status } : r)),
    }));
    showToast('تم تحصيل المبلغ المستحق بنجاح ✓');

    try {
      if (!id.startsWith('temp-')) {
        await updateFirestoreDoc('receivables', id, {
          collectedAmount: newCollected,
          status,
        });
      }

      if (autoLogIncome && additionalCollection > 0) {
        await handleAddIncome({
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
    const previousReceivables = state.receivables;
    setState((prev) => ({
      ...prev,
      receivables: prev.receivables.filter((item) => item.id !== id),
    }));
    showToast('تم حذف المستحق.');

    try {
      if (!id.startsWith('temp-')) {
        await deleteFirestoreDoc('receivables', id);
      }
    } catch (err) {
      console.error('Error deleting receivable:', err);
      setState((prev) => ({ ...prev, receivables: previousReceivables }));
    }
  };

  const handleAddGoal = async (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'isCompleted'>) => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً لحفظ الهدف.');
      return;
    }
    const remaining = Math.max(0, goal.targetAmount - goal.currentSavedAmount);
    const tempId = `temp-${Date.now()}`;
    const newRecord: FinancialGoal = {
      ...goal,
      id: tempId,
      isCompleted: remaining <= 0,
      createdAt: new Date().toISOString(),
    };

    // Optimistic Update
    setState((prev) => ({
      ...prev,
      goals: [newRecord, ...prev.goals],
    }));
    showToast('تم إضافة الهدف المالي بنجاح...');

    try {
      await addFirestoreDoc('goals', user.uid, {
        ...goal,
        isCompleted: remaining <= 0,
      });
      showToast('تم حفظ الهدف المالي في Firebase ✓');
    } catch (err) {
      console.error('Error adding goal to Firestore:', err);
      showToast('حدث خطأ أثناء إضافة الهدف!');
    }
  };

  const handleUpdateGoalSavings = async (id: string, newSavedAmount: number) => {
    const item = state.goals.find((g) => g.id === id);
    if (!item) return;

    const clamped = Math.min(item.targetAmount, newSavedAmount);
    // Optimistic Update
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, currentSavedAmount: clamped, isCompleted: clamped >= g.targetAmount } : g)),
    }));
    showToast('تم تحديث المدخرات بنجاح ✓');

    try {
      if (!id.startsWith('temp-')) {
        await updateFirestoreDoc('goals', id, {
          currentSavedAmount: clamped,
          isCompleted: clamped >= item.targetAmount,
        });
      }
    } catch (err) {
      console.error('Error updating goal savings:', err);
    }
  };

  const handleToggleGoalComplete = async (id: string) => {
    const item = state.goals.find((g) => g.id === id);
    if (!item) return;

    // Optimistic Update
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, isCompleted: !g.isCompleted } : g)),
    }));

    try {
      if (!id.startsWith('temp-')) {
        await updateFirestoreDoc('goals', id, {
          isCompleted: !item.isCompleted,
        });
      }
    } catch (err) {
      console.error('Error toggling goal complete:', err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const previousGoals = state.goals;
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((item) => item.id !== id),
    }));
    showToast('تم حذف الهدف.');

    try {
      if (!id.startsWith('temp-')) {
        await deleteFirestoreDoc('goals', id);
      }
    } catch (err) {
      console.error('Error deleting goal:', err);
      setState((prev) => ({ ...prev, goals: previousGoals }));
    }
  };

  const handleToggleCurrency = () => {
    setState((prev) => ({
      ...prev,
      currency: prev.currency === 'EGP' ? 'USD' : prev.currency === 'USD' ? 'SAR' : 'EGP',
    }));
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
    <div className="h-[100dvh] w-full flex bg-slate-950 text-slate-100 overflow-hidden select-none dir-rtl font-sans">
      
      {/* Desktop & Tablet Sidebar Navigation */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          state={state}
          user={user}
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
          onToggleCurrency={handleToggleCurrency}
        />
      </div>

      {/* Main App Workspace Shell */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden shrink-0 z-30">
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
        </div>

        {/* Desktop Top Workspace Bar */}
        <header className="hidden md:flex h-14 bg-slate-900/90 border-b border-slate-800/80 px-6 items-center justify-between shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white">
              {activeTab === 'dashboard' && 'الرئيسية - لوحة التحكم المالية الموحدة'}
              {activeTab === 'income' && 'سجل المقبوضات والدخل اليومي'}
              {activeTab === 'expenses' && 'سجل المصروفات والنفقات اليومية'}
              {activeTab === 'liabilities' && 'جدول الديون والالتزامات (فلوس عليا)'}
              {activeTab === 'receivables' && 'جدول المستحقات (فلوس ليا)'}
              {activeTab === 'goals' && 'الأهداف المالية والتسويات المعلقة'}
              {activeTab === 'ai_tools' && 'المساعد الذكي وحاسبة الذكاء الاصطناعي'}
            </h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-700">
              نظام محفطتي السحابي
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">حالة البيانات:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                تزامن سحابي نَشِط
              </span>
            </div>
          </div>
        </header>

        {/* Main Full Viewport Scrollable App Content Workspace */}
        <main className="flex-1 overflow-y-auto w-full p-3 sm:p-6 space-y-6 pb-24 md:pb-6 scroll-smooth max-w-7xl mx-auto">
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

      </div>

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

      {/* Mobile Sticky Bottom Navigation Bar (Hidden on Desktop) */}
      <div className="md:hidden shrink-0 z-40">
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          state={state}
        />
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 dir-rtl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
