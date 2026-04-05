import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Handsontable from 'handsontable';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
import { HotTableRegisterer } from '@handsontable/angular';
import { FinanceService } from '../../core/services/finance.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Transaction, TransactionCategory, TransactionType } from '../../core/models/transaction.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-transactions',
  template: `
    <div class="transactions">
      <div class="transactions__header">
        <div>
          <h1 class="transactions__title">Transactions</h1>
          <p class="transactions__subtitle">Manage and review all your financial transactions</p>
        </div>
        <div class="transactions__actions">
          <button class="btn btn--success" (click)="saveTableData()" *ngIf="isAdmin" id="btn-save-data">
            <i class="fa fa-save"></i> Save Data
          </button>
          <button class="btn btn--secondary" (click)="exportToPDF()" *ngIf="isAdmin" id="btn-export-pdf">
            <i class="fa fa-file-pdf"></i> Download PDF
          </button>
          <button class="btn btn--danger" (click)="deleteSelected()" *ngIf="isAdmin && selectedRows.length > 0" id="btn-delete-selected">
            <i class="fa fa-trash"></i> Delete ({{ selectedRows.length }})
          </button>
          <button class="btn btn--primary" (click)="addNewTransaction()" *ngIf="isAdmin" id="btn-add-transaction">
            <i class="fa fa-plus"></i> Add Transaction
          </button>
        </div>
      </div>

      <!-- Toast Notification -->
      <div class="toast-notification" [ngClass]="'toast-' + toastType" [class.toast-notification--visible]="showToast">
        <i class="fa" [ngClass]="toastType === 'success' ? 'fa-check-circle' : 'fa-trash'"></i>
        <span>{{ toastMessage }}</span>
      </div>

      <div class="transactions__filters">
        <div class="filter-group">
          <div class="search-box" id="search-box">
            <i class="fa fa-search"></i>
            <input type="text" placeholder="Search transactions..." [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()" id="search-input">
          </div>
          <select [(ngModel)]="filterType" (ngModelChange)="applyFilters()" class="filter-select" id="filter-type">
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select [(ngModel)]="filterCategory" (ngModelChange)="applyFilters()" class="filter-select" id="filter-category">
            <option value="all">All Categories</option>
            <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
          </select>
        </div>
        <div class="filter-stats">
          <span class="stats-badge">{{ filteredTransactions.length }} transactions</span>
          <span class="stats-badge stats-badge--income">
            Income: {{ totalFilteredIncome | currencyFormat }}
          </span>
          <span class="stats-badge stats-badge--expense">
            Expenses: {{ totalFilteredExpenses | currencyFormat }}
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div class="empty-state" *ngIf="isLoading">
        <i class="fa fa-spinner fa-spin"></i>
        <h3>Loading Transactions</h3>
        <p>Retrieving your financial data...</p>
      </div>

      <div class="empty-state" *ngIf="!isLoading && filteredTransactions.length === 0">
        <i class="fa fa-folder-open empty-icon"></i>
        <h3 *ngIf="allTransactions.length === 0">No records found</h3>
        <p *ngIf="allTransactions.length === 0">Add a new transaction to get started.</p>
        <h3 *ngIf="allTransactions.length > 0">No results</h3>
        <p *ngIf="allTransactions.length > 0">Try adjusting your search or filters.</p>
      </div>

      <div class="transactions__table-container" *ngIf="!isLoading && filteredTransactions.length > 0">
        <div class="table-scroll-container">
          <hot-table
            [hotId]="hotId"
            [settings]="hotSettings"
            [colHeaders]="hotHeaders"
            [rowHeaders]="true"
            width="100%"
            height="auto"
            [stretchH]="'all'"
            [data]="paginatedTransactions"
            licenseKey="non-commercial-and-evaluation">
          </hot-table>
        </div>
        <div class="pagination">
          <button class="pagination__btn" (click)="prevPage()" [disabled]="currentPage === 1" title="Previous Page">
            <i class="fa fa-chevron-left"></i>
          </button>
          <span class="pagination__info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="pagination__btn" (click)="nextPage()" [disabled]="currentPage === totalPages || totalPages === 0" title="Next Page">
            <i class="fa fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .transactions { animation: fadeIn 0.4s ease; }
    .transactions__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .transactions__title {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 4px;
    }
    .transactions__subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
    .transactions__actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .btn--primary {
      background: linear-gradient(135deg, #1482C4, #4AA8E2);
      color: #fff;
    }
    .btn--primary:hover {
      box-shadow: 0 4px 12px rgba(20,130,196,0.3);
      transform: translateY(-1px);
    }
    .btn--secondary {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--card-border);
    }
    .btn--secondary:hover {
      background: var(--card-bg);
      border-color: #1482C4;
    }
    .btn--danger {
      background: linear-gradient(135deg, #ef4444, #f87171);
      color: #fff;
      box-shadow: 0 2px 8px rgba(239,68,68,0.3);
    }
    .btn--danger:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239,68,68,0.4);
    }
    .btn--success {
      background: linear-gradient(135deg, #10b981, #34d399);
      color: #fff;
    }
    .btn--success:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16,185,129,0.3);
    }
    .transactions__filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 0 14px;
      min-width: 260px;
      transition: all 0.2s;
    }
    .search-box:focus-within {
      border-color: #1482C4;
      box-shadow: 0 0 0 3px rgba(20,130,196,0.1);
    }
    .search-box i { color: var(--text-tertiary); font-size: 14px; }
    .search-box input {
      border: none;
      background: transparent;
      padding: 10px 0;
      font-size: 13px;
      color: var(--text-primary);
      outline: none;
      width: 100%;
      font-family: inherit;
    }
    .search-box input::placeholder { color: var(--text-tertiary); }
    .filter-select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background: var(--card-bg);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231482C4' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      background-size: 14px;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 10px 40px 10px 16px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      outline: none;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 150px;
    }
    .filter-select:hover {
      border-color: #1482C4;
      background-color: var(--bg-primary);
    }
    .filter-select:focus {
      border-color: #1482C4;
      box-shadow: 0 0 0 4px rgba(20,130,196, 0.1);
    }
    .filter-stats {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .stats-badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }
    .stats-badge--income { background: rgba(16,185,129,0.1); color: #10b981; }
    .stats-badge--expense { background: rgba(239,68,68,0.1); color: #ef4444; }
    .transactions__table-container {
      background: var(--card-bg);
      border-radius: 16px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--card-border);
      overflow: hidden;
      padding: 0;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    .pagination {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 12px 20px;
      gap: 16px;
      background: var(--card-bg);
      border-top: 1px solid var(--card-border);
    }
    .empty-state {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 60px 40px;
      text-align: center;
      box-shadow: var(--card-shadow);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .empty-state i {
      font-size: 48px;
      color: var(--text-tertiary);
      margin-bottom: 20px;
      opacity: 0.6;
    }
    .empty-state h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px;
    }
    .empty-state p {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
    .pagination__info {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
      min-width: 80px;
      text-align: center;
    }
    .pagination__btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      background: var(--bg-secondary);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pagination__btn:hover:not([disabled]) {
      background: #1482C4;
      color: #fff;
      border-color: #1482C4;
    }
    .pagination__btn[disabled] {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .toast-notification {
      position: fixed;
      bottom: 30px;
      right: 30px;
      color: white;
      padding: 14px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      transform: translateY(100px);
      opacity: 0;
      visibility: hidden;
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      z-index: 1000;
    }
    .toast-success {
      background: #10b981;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
    }
    .toast-danger {
      background: #ef4444;
      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4);
    }
    .toast-notification--visible {
      transform: translateY(0);
      opacity: 1;
      visibility: visible;
    }
    .toast-notification i {
      font-size: 18px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 768px) {
      .transactions__header { flex-direction: column; }
      .filter-group { width: 100%; }
      .search-box { min-width: 100%; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default
})
export class TransactionsComponent implements OnInit, OnDestroy, AfterViewInit {
  hotId = 'transactionsTable';
  hotSettings: Handsontable.GridSettings = {};
  hotHeaders = ['ID', 'Date', 'Description', 'Amount', 'Category', 'Type'];
  allTransactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  paginatedTransactions: Transaction[] = [];
  selectedRows: number[] = [];
  isAdmin = false;
  isLoading = true;
  isTableEditing = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' = 'success';
  private toastTimeout: any;

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  searchQuery = '';
  filterType: 'all' | TransactionType = 'all';
  filterCategory = 'all';

  categories: TransactionCategory[] = [
    'Shopping', 'Groceries', 'Healthcare', 'Transportation',
    'Entertainment', 'Dining', 'Utilities', 'Rent',
    'Salary', 'Freelance', 'Investment', 'Other'
  ];

  private destroy$ = new Subject<void>();
  private hotInstance: Handsontable | null = null;

  constructor(
    private financeService: FinanceService,
    private authService: AuthService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private hotRegisterer: HotTableRegisterer
  ) { }

  ngOnInit(): void {
    this.initTableSettings();

    this.authService.isAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAdmin: boolean) => {
        this.isAdmin = isAdmin;
        this.initTableSettings();
        this.syncHotSettings();
      });

    this.financeService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading: boolean) => {
        this.isLoading = loading;
      });

    this.financeService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe((txns: Transaction[]) => {
        this.allTransactions = txns.map((t: Transaction) => ({ ...t }));
        // If the table is actively making edits, don't re-create the paginated array to avoid wiping cell state
        if (this.isTableEditing) {
          this.applyFilters(true);
        } else {
          this.applyFilters(false);
        }
      });

    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.scheduleRender();
      });
  }

  ngAfterViewInit(): void {
    // Retry acquiring the Handsontable instance until it's available
    this.acquireInstanceWithRetry(8, 250);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.hotInstance = null;
  }

  get totalFilteredIncome(): number {
    return this.filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  get totalFilteredExpenses(): number {
    return this.filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  applyFilters(skipTableUpdate = false): void {
    let results = [...this.allTransactions];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      results = results.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.date.includes(q)
      );
    }

    if (this.filterType !== 'all') {
      results = results.filter(t => t.type === this.filterType);
    }

    if (this.filterCategory !== 'all') {
      results = results.filter(t => t.category === this.filterCategory);
    }

    this.filteredTransactions = results;

    if (!skipTableUpdate) {
      // Normal flow: resetting pagination and generating a new array reference
      this.currentPage = 1;
      this.updatePagination();
    } else {
      // Quiet update: update sums without destroying table bindings
      this.cdr.detectChanges();
    }
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;

    // New array reference so Angular [data] binding picks up the change
    this.paginatedTransactions = [...this.filteredTransactions.slice(start, start + this.pageSize)];

    // Schedule a Handsontable re-render after Angular processes the DOM
    this.scheduleRender();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  addNewTransaction(): void {
    this.financeService.addTransaction({
      date: new Date().toISOString().split('T')[0],
      description: 'New Transaction',
      amount: 0,
      category: 'Other',
      type: 'expense'
    });
  }

  saveTableData(): void {
    this.financeService.bulkUpdateTransactions(this.allTransactions);
    this.showNotification('Table data saved successfully!', 'success');
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const head = [this.hotHeaders];
    const body = this.filteredTransactions.map(t => [
      t.id,
      t.date,
      t.description,
      `$${t.amount.toFixed(2)}`,
      t.category,
      t.type
    ]);

    autoTable(doc, {
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [20, 130, 196] }
    });

    doc.save('findash-transactions.pdf');
  }

  private showNotification(message: string, type: 'success' | 'danger'): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  deleteSelected(): void {
    const deletedCount = this.selectedRows.length;
    this.selectedRows.forEach(idx => {
      const txn = this.filteredTransactions[idx];
      if (txn) {
        this.financeService.deleteTransaction(txn.id);
      }
    });
    this.selectedRows = [];
    this.showNotification(`Deleted ${deletedCount} transaction${deletedCount > 1 ? 's' : ''}`, 'danger');
  }

  // ─── Private Helpers ──────────────────────────────────

  /** Try to acquire the Handsontable instance, retrying N times */
  private acquireInstanceWithRetry(retries: number, delayMs: number): void {
    setTimeout(() => {
      this.refreshHotInstance();
      if (this.hotInstance) {
        this.hotInstance.render();
      } else if (retries > 0) {
        this.acquireInstanceWithRetry(retries - 1, delayMs);
      }
    }, delayMs);
  }

  /** Safely re-acquire the Handsontable instance */
  private refreshHotInstance(): void {
    try {
      const inst = this.hotRegisterer.getInstance(this.hotId);
      if (inst) {
        this.hotInstance = inst;
      }
    } catch {
      this.hotInstance = null;
    }
  }

  /** Schedule a Handsontable re-render after the DOM settles */
  private scheduleRender(): void {
    setTimeout(() => {
      this.refreshHotInstance();
      if (this.hotInstance) {
        this.hotInstance.render();
      }
    }, 150);
  }

  /** Push current hotSettings into the live Handsontable instance */
  private syncHotSettings(): void {
    this.refreshHotInstance();
    if (this.hotInstance) {
      this.hotInstance.updateSettings(this.hotSettings);
    }
  }

  private initTableSettings(): void {
    const self = this;
    this.hotSettings = {
      columns: [
        { data: 'id', type: 'numeric', readOnly: true, width: 60, className: 'htCenter htMiddle' },
        { data: 'date', type: 'text', width: 120, readOnly: !this.isAdmin, className: 'htCenter htMiddle' },
        { data: 'description', type: 'text', width: 220, readOnly: !this.isAdmin, className: 'htLeft htMiddle' },
        {
          data: 'amount',
          type: 'numeric',
          numericFormat: { pattern: '$0,0.00' },
          width: 120,
          readOnly: !this.isAdmin,
          className: 'htRight htMiddle font-weight-bold',
          validator: function (value: any, callback: any) {
            const amount = Number(value);
            callback(!isNaN(amount) && amount > 0);
          }
        },
        {
          data: 'category',
          type: 'dropdown',
          source: this.categories,
          width: 140,
          readOnly: !this.isAdmin,
          className: 'htLeft htMiddle'
        },
        {
          data: 'type',
          type: 'dropdown',
          source: ['income', 'expense'],
          width: 100,
          readOnly: !this.isAdmin,
          className: 'htCenter htMiddle'
        }
      ],
      rowHeights: 48,
      rowHeaders: true,
      autoWrapRow: true,
      autoWrapCol: true,
      manualColumnResize: true,
      manualRowResize: true,
      columnSorting: true,
      filters: true,
      dropdownMenu: this.isAdmin ? {
        items: {
          'filter_by_condition': {},
          'filter_by_value': {},
          'filter_action_bar': {},
          'clear_column': {},
          'hsep1': '---------',
          'alignment': {}
        }
      } : false,
      contextMenu: this.isAdmin ? {
        items: {
          'row_above': { name: 'Insert row above' },
          'row_below': { name: 'Insert row below' },
          'hsep1': '---------',
          'remove_row': { name: 'Remove selected row(s)' },
          'hsep2': '---------',
          'undo': {},
          'redo': {},
          'hsep3': '---------',
          'alignment': {},
          'copy': {},
          'cut': {}
        }
      } : false,
      search: true,
      hiddenColumns: true,
      hiddenRows: true,
      copyPaste: true,
      persistentState: true,
      className: 'transactions-table',
      licenseKey: 'non-commercial-and-evaluation',
      afterChange: function (changes: any, source: string) {
        if (source === 'loadData' || !changes) return;

        self.isTableEditing = true;

        self.ngZone.run(() => {
          let hasRealChanges = false;

          if (!self.hotInstance) {
            self.isTableEditing = false;
            return;
          }

          changes.forEach(([row, prop, oldVal, newVal]: any) => {
            if (oldVal === newVal) return;
            hasRealChanges = true;

            // Get the actual object from Handsontable's source data
            const rowData = self.hotInstance?.getSourceDataAtRow(row) as Transaction;

            if (rowData && rowData.id) {
              const changesToApply: any = { [prop]: newVal };
              if (prop === 'amount') {
                changesToApply.amount = Number(newVal) || 0;
              }
              self.financeService.updateTransaction(rowData.id, changesToApply);
            }
          });

          if (!hasRealChanges) {
            self.isTableEditing = false;
          }
        });

        // Set to false after synchronous events execute
        setTimeout(() => {
          self.isTableEditing = false;
        }, 50);
      },
      afterSelection: function (_r: number, _c: number, r2: number) {
        self.ngZone.run(() => {
          self.selectedRows = [r2];
        });
      }
    };
  }
}
