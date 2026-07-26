export type IncomeCategory = 'orders' | 'tips' | 'salary' | 'other';

export interface IncomeRecord {
  id: string;
  amount: number;
  date: string;
  category: IncomeCategory;
  source: string; // اسم المطعم، الصيدلية، العميل، إلخ
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'order_upfront' 
  | 'fuel' 
  | 'bike_maintenance' 
  | 'phone' 
  | 'meals' 
  | 'home' 
  | 'other';

export interface ExpenseRecord {
  id: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  description: string;
  linkedIncomeId?: string; // ربط دفع مقدم بتحصيل
  notes?: string;
  createdAt: string;
}

export type LiabilityCategory = 
  | 'rent' 
  | 'installment' 
  | 'jam3eya' 
  | 'company' 
  | 'personal_debt' 
  | 'utility' 
  | 'other';

export interface LiabilityRecord {
  id: string;
  creditorName: string; // جهة الدين / الالتزام
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  category: LiabilityCategory;
  notes?: string;
  status: 'unpaid' | 'partial' | 'paid';
  createdAt: string;
}

export type ReceivableCategory = 
  | 'restaurant' 
  | 'client' 
  | 'company' 
  | 'friend' 
  | 'other';

export interface ReceivableRecord {
  id: string;
  debtorName: string; // اسم الشخص أو جهة العمل
  totalAmount: number;
  collectedAmount: number;
  expectedDate: string;
  category: ReceivableCategory;
  notes?: string;
  status: 'pending' | 'partial' | 'collected';
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentSavedAmount: number;
  targetDate: string;
  category: 'asset' | 'debt_settlement' | 'emergency_fund' | 'personal';
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface AppState {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  liabilities: LiabilityRecord[];
  receivables: ReceivableRecord[];
  goals: FinancialGoal[];
  currency: string; // default "ج.م"
  dailyTargetEarnings: number; // target daily earning e.g., 300 EGP
}

export interface NetGapAnalysis {
  walletBalance: number; // إجمالي الدخل - إجمالي المصروفات
  totalLiabilities: number; // إجمالي الالتزامات المتبقية (فلوس عليا)
  totalReceivables: number; // إجمالي المستحقات المتبقية (فلوس ليا)
  netGap: number; // totalLiabilities - (walletBalance + totalReceivables)
  isSafe: boolean; // netGap <= 0
  surplus: number; // if isSafe, how much surplus
  daysToCoverGap?: number;
}
