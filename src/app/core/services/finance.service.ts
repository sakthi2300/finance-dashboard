import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Transaction,
  TransactionCategory,
  FinanceSummary,
  CategoryBreakdown,
  TrendDataPoint,
  InsightData,
  MonthlyComparison
} from '../models/transaction.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly TRANSACTIONS_KEY = 'findash_transactions';

  private transactionsSubject: BehaviorSubject<Transaction[]>;
  public transactions$: Observable<Transaction[]>;
  public summary$: Observable<FinanceSummary>;
  public categoryBreakdown$: Observable<CategoryBreakdown[]>;
  public trendData$: Observable<TrendDataPoint[]>;
  public insights$: Observable<InsightData>;

  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  private readonly CATEGORY_COLORS: Record<string, string> = {
    'Shopping': '#1482C4',
    'Groceries': '#10b981',
    'Healthcare': '#f59e0b',
    'Transportation': '#06b6d4',
    'Entertainment': '#ec4899',
    'Dining': '#f97316',
    'Utilities': '#8b5cf6',
    'Rent': '#ef4444',
    'Salary': '#22c55e',
    'Freelance': '#3b82f6',
    'Investment': '#14b8a6',
    'Other': '#6b7280'
  };

  constructor(private storageService: StorageService) {
    const saved = this.storageService.get<Transaction[]>(this.TRANSACTIONS_KEY);
    const initialData = saved && saved.length > 0 ? saved : this.generateMockData();

    if (!saved || saved.length === 0) {
      this.storageService.set(this.TRANSACTIONS_KEY, initialData);
    }

    this.transactionsSubject = new BehaviorSubject<Transaction[]>(initialData);
    this.transactions$ = this.transactionsSubject.asObservable();
    
    // Data is loaded synchronously from localStorage, so no loading delay needed
    this.loadingSubject.next(false);

    this.summary$ = this.transactions$.pipe(
      map(txns => this.calculateSummary(txns))
    );

    this.categoryBreakdown$ = this.transactions$.pipe(
      map(txns => this.calculateCategoryBreakdown(txns))
    );

    this.trendData$ = this.transactions$.pipe(
      map(txns => this.calculateTrendData(txns))
    );

    this.insights$ = combineLatest([
      this.transactions$,
      this.categoryBreakdown$
    ]).pipe(
      map(([txns, categories]) => this.calculateInsights(txns, categories))
    );
  }

  get transactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

  addTransaction(transaction: Omit<Transaction, 'id'>, persist = false): void {
    const current = this.transactionsSubject.value;
    const newId = current.length > 0 ? Math.max(...current.map(t => t.id)) + 1 : 1;
    const newTransaction: Transaction = { ...transaction, id: newId };
    const updated = [newTransaction, ...current];
    this.updateTransactions(updated, persist);
  }

  updateTransaction(id: number, changes: Partial<Transaction>, persist = false): void {
    const current = this.transactionsSubject.value;
    const updated = current.map(t => t.id === id ? { ...t, ...changes } : t);
    this.updateTransactions(updated, persist);
  }

  deleteTransaction(id: number, persist = false): void {
    const current = this.transactionsSubject.value;
    const updated = current.filter(t => t.id !== id);
    this.updateTransactions(updated, persist);
  }

  bulkUpdateTransactions(transactions: Transaction[]): void {
    this.updateTransactions(transactions, true);
  }

  private updateTransactions(transactions: Transaction[], persist: boolean): void {
    this.transactionsSubject.next(transactions);
    if (persist) {
      this.storageService.set(this.TRANSACTIONS_KEY, transactions);
    }
  }

  private calculateSummary(transactions: Transaction[]): FinanceSummary {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = totalIncome - totalExpenses;

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      balanceChange: 12.5,
      incomeChange: 8.2,
      expenseChange: -3.1
    };
  }

  private calculateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<string, number>();
    expenses.forEach(t => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + t.amount);
    });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category: category as TransactionCategory,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
        color: this.CATEGORY_COLORS[category] || '#6b7280'
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  private calculateTrendData(transactions: Transaction[]): TrendDataPoint[] {
    const days = 15;
    const trendData: TrendDataPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTxns = transactions.filter(t => t.date === dateStr);
      const income = dayTxns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTxns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      trendData.push({ date: dateStr, income, expense });
    }

    return trendData;
  }

  private calculateInsights(transactions: Transaction[], categories: CategoryBreakdown[]): InsightData {
    const highestSpendingCategory = categories.length > 0
      ? categories[0]
      : { category: 'Other' as TransactionCategory, amount: 0, percentage: 0, color: '#6b7280' };

    const monthlyComparisons = this.getMonthlyComparisons(transactions);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const months = new Set(transactions.map(t => t.date.substring(0, 7))).size || 1;

    const insightText = highestSpendingCategory.amount > 0 
      ? `${highestSpendingCategory.category} is the highest spending category this month, making up ${highestSpendingCategory.percentage}% of expenses.`
      : 'No spending insights available.';

    return {
      highestSpendingCategory,
      monthlyComparisons,
      averageMonthlyIncome: totalIncome / months,
      averageMonthlyExpense: totalExpenses / months,
      topExpenseCategories: categories.slice(0, 5),
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      insightText
    };
  }

  private getMonthlyComparisons(transactions: Transaction[]): MonthlyComparison[] {
    const monthMap = new Map<string, { income: number; expenses: number }>();

    transactions.forEach(t => {
      const month = t.date.substring(0, 7);
      const current = monthMap.get(month) || { income: 0, expenses: 0 };
      if (t.type === 'income') {
        current.income += t.amount;
      } else {
        current.expenses += t.amount;
      }
      monthMap.set(month, current);
    });

    return Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .reverse()
      .map(([month, data]) => {
        const savings = data.income - data.expenses;
        return {
          month,
          income: data.income,
          expenses: data.expenses,
          savings,
          savingsRate: data.income > 0 ? (savings / data.income) * 100 : 0
        };
      });
  }

  private generateMockData(): Transaction[] {
    const categories: TransactionCategory[] = [
      'Shopping', 'Groceries', 'Healthcare', 'Transportation',
      'Entertainment', 'Dining', 'Utilities', 'Rent'
    ];
    const incomeCategories: TransactionCategory[] = ['Salary', 'Freelance', 'Investment'];
    const descriptions: Record<string, string[]> = {
      'Shopping': ['Amazon Purchase', 'Clothing Store', 'Electronics Store', 'Online Shopping'],
      'Groceries': ['Whole Foods', 'Trader Joe\'s', 'Local Market', 'Costco'],
      'Healthcare': ['Pharmacy', 'Doctor Visit', 'Dental Checkup', 'Lab Tests'],
      'Transportation': ['Gas Station', 'Uber Ride', 'Metro Card', 'Car Maintenance'],
      'Entertainment': ['Netflix', 'Movie Tickets', 'Concert', 'Spotify'],
      'Dining': ['Restaurant', 'Coffee Shop', 'Food Delivery', 'Lunch'],
      'Utilities': ['Electric Bill', 'Water Bill', 'Internet', 'Phone Bill'],
      'Rent': ['Monthly Rent', 'Parking Space'],
      'Salary': ['Monthly Salary', 'Bonus'],
      'Freelance': ['Project Payment', 'Consulting Fee'],
      'Investment': ['Stock Dividend', 'Interest Income']
    };

    const transactions: Transaction[] = [];
    let id = 1;
    const today = new Date();

    // Generate 3 months of data
    for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split('T')[0];

      // Add 1-3 expenses per day randomly
      const numExpenses = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numExpenses; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const descs = descriptions[cat] || ['Payment'];
        transactions.push({
          id: id++,
          date: dateStr,
          description: descs[Math.floor(Math.random() * descs.length)],
          amount: Math.round((Math.random() * 150 + 5) * 100) / 100,
          category: cat,
          type: 'expense'
        });
      }

      // Add income on specific days (1st and 15th or random)
      if (date.getDate() === 1 || date.getDate() === 15) {
        transactions.push({
          id: id++,
          date: dateStr,
          description: 'Monthly Salary',
          amount: 3500,
          category: 'Salary',
          type: 'income'
        });
      }

      // Random freelance/investment income
      if (Math.random() < 0.08) {
        const incomeCat = incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
        const descs = descriptions[incomeCat] || ['Income'];
        transactions.push({
          id: id++,
          date: dateStr,
          description: descs[Math.floor(Math.random() * descs.length)],
          amount: Math.round((Math.random() * 500 + 100) * 100) / 100,
          category: incomeCat,
          type: 'income'
        });
      }
    }

    return transactions.sort((a, b) => b.date.localeCompare(a.date));
  }
}
