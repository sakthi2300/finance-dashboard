export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
}

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'Shopping'
  | 'Groceries'
  | 'Healthcare'
  | 'Transportation'
  | 'Entertainment'
  | 'Dining'
  | 'Utilities'
  | 'Rent'
  | 'Salary'
  | 'Freelance'
  | 'Investment'
  | 'Other';

export interface FinanceSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  balanceChange: number;
  incomeChange: number;
  expenseChange: number;
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  color: string;
}

export interface TrendDataPoint {
  date: string;
  income: number;
  expense: number;
}

export interface MonthlyComparison {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
}

export interface InsightData {
  highestSpendingCategory: CategoryBreakdown;
  monthlyComparisons: MonthlyComparison[];
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  topExpenseCategories: CategoryBreakdown[];
  savingsRate: number;
  insightText?: string;
}
