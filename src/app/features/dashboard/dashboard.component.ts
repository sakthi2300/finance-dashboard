import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FinanceService } from '../../core/services/finance.service';
import { AuthService } from '../../core/services/auth.service';
import {
  FinanceSummary,
  CategoryBreakdown,
  TrendDataPoint
} from '../../core/models/transaction.model';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <div class="dashboard__header">
        <div>
          <h1 class="dashboard__title">Dashboard</h1>
          <p class="dashboard__subtitle">Welcome back! Here's your financial overview.</p>
        </div>
      </div>

      <ng-container *ngIf="summary$ | async as summary">
        <div class="dashboard__cards">
          <app-summary-card
            label="Total Balance"
            [value]="summary.totalBalance"
            [change]="summary.balanceChange"
            icon="fa-wallet"
            variant="balance">
          </app-summary-card>
          <app-summary-card
            label="Total Income"
            [value]="summary.totalIncome"
            [change]="summary.incomeChange"
            icon="fa-arrow-trend-up"
            variant="income">
          </app-summary-card>
          <app-summary-card
            label="Total Expenses"
            [value]="summary.totalExpenses"
            [change]="summary.expenseChange"
            icon="fa-arrow-trend-down"
            variant="expense">
          </app-summary-card>
        </div>
      </ng-container>

      <div class="dashboard__charts">
        <div class="dashboard__chart-card">
          <div class="chart-card__header">
            <div>
              <h3 class="chart-card__title">Income & Expenses Trend</h3>
              <p class="chart-card__subtitle">Last 15 days overview</p>
            </div>
          </div>
          <div class="chart-card__body">
            <app-trend-chart
              *ngIf="(trendData$ | async) as trendData; else loadingTrend"
              [data]="trendData">
            </app-trend-chart>
            <ng-template #loadingTrend>
              <div class="chart-empty-state">
                <i class="fa fa-chart-area"></i>
                <p>No trend data available for selected filters</p>
              </div>
            </ng-template>
          </div>
        </div>

        <div class="dashboard__chart-card">
          <div class="chart-card__header">
            <div>
              <h3 class="chart-card__title">Expense by Category</h3>
              <p class="chart-card__subtitle">Distribution breakdown</p>
            </div>
          </div>
          <div class="chart-card__body">
            <app-category-chart
              *ngIf="(categoryBreakdown$ | async) as categories; else loadingCat"
              [data]="categories">
            </app-category-chart>
            <ng-template #loadingCat>
              <div class="chart-empty-state">
                <i class="fa fa-chart-pie"></i>
                <p>No category breakdown available</p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { animation: fadeIn 0.4s ease; }
    .dashboard__header { margin-bottom: 28px; }
    .dashboard__title {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 4px;
    }
    .dashboard__subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
    .dashboard__cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 28px;
    }
    .dashboard__charts {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 20px;
    }
    .dashboard__chart-card {
      background: var(--card-bg);
      border-radius: 16px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--card-border);
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .dashboard__chart-card:hover {
      box-shadow: var(--card-shadow-hover);
    }
    .chart-card__header {
      padding: 20px 24px 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .chart-card__title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 4px;
    }
    .chart-card__subtitle {
      font-size: 12px;
      color: var(--text-tertiary);
      margin: 0;
    }
    .chart-empty-state {
      height: 250px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      opacity: 0.6;
      color: var(--text-tertiary);
      animation: fadeIn 0.4s ease;
    }
    .chart-empty-state i { font-size: 32px; }
    .chart-empty-state p { font-size: 13px; font-weight: 500; margin: 0; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 1024px) {
      .dashboard__cards { grid-template-columns: 1fr; }
      .dashboard__charts { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  summary$!: Observable<FinanceSummary>;
  categoryBreakdown$!: Observable<CategoryBreakdown[]>;
  trendData$!: Observable<TrendDataPoint[]>;

  constructor(
    private financeService: FinanceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.summary$ = this.financeService.summary$;
    this.categoryBreakdown$ = this.financeService.categoryBreakdown$;
    this.trendData$ = this.financeService.trendData$;
  }
}
