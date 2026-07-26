import { AppState, NetGapAnalysis } from './types';

export function calculateFinancials(state: AppState): NetGapAnalysis {
  // 1. Total Income
  const totalIncome = state.incomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // 2. Total Expense
  const totalExpense = state.expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // 3. Wallet Balance
  const walletBalance = totalIncome - totalExpense;

  // 4. Total Remaining Liabilities ("فلوس عليا")
  const totalLiabilities = state.liabilities.reduce((acc, curr) => {
    const remaining = Math.max(0, (curr.totalAmount || 0) - (curr.paidAmount || 0));
    return acc + remaining;
  }, 0);

  // 5. Total Remaining Receivables ("فلوس ليا")
  const totalReceivables = state.receivables.reduce((acc, curr) => {
    const remaining = Math.max(0, (curr.totalAmount || 0) - (curr.collectedAmount || 0));
    return acc + remaining;
  }, 0);

  // 6. Net Gap Calculation ("لسة محتاج")
  // Net Gap = Liabilities - (Current Cash + Receivables)
  const netGapRaw = totalLiabilities - (walletBalance + totalReceivables);
  const isSafe = netGapRaw <= 0;
  const netGap = isSafe ? 0 : netGapRaw;
  const surplus = isSafe ? Math.abs(netGapRaw) : 0;

  // Average daily net earnings (last 7 days or based on target)
  const dailyTarget = state.dailyTargetEarnings || 350;
  const daysToCoverGap = !isSafe && dailyTarget > 0 ? Math.ceil(netGap / dailyTarget) : 0;

  return {
    walletBalance,
    totalLiabilities,
    totalReceivables,
    netGap,
    isSafe,
    surplus,
    daysToCoverGap,
  };
}

export function formatCurrency(amount: number, currency: string = 'ج.م'): string {
  const formatted = new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function formatDateArabic(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return dateObj.toLocaleDateString('ar-EG', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
