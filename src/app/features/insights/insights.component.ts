import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as Highcharts from 'highcharts';
import { FinanceService } from '../../core/services/finance.service';
import { ThemeService } from '../../core/services/theme.service';
import { InsightData, CategoryBreakdown, MonthlyComparison } from '../../core/models/transaction.model';

@Component({
  selector: 'app-insights',
  template: `
      <div class="insights" *ngIf="insights$ | async as insights">
        <div class="insights__header">
          <div>
            <h1 class="insights__title">Insights</h1>
            <p class="insights__subtitle">Deep analysis of your financial patterns and trends</p>
          </div>
          
          <!-- Smart Analysis Highlight -->
          <div class="smart-insight anim-slide-in" *ngIf="insights.insightText">
            <div class="smart-insight__icon">
              <i class="fa fa-lightbulb"></i>
            </div>
            <div class="smart-insight__content">
              <span class="smart-insight__label">Smart Analysis</span>
              <p class="smart-insight__text">{{ insights.insightText }}</p>
            </div>
          </div>
        </div>

        <!-- Empty State for Insights -->
        <div class="empty-insights" *ngIf="insights.monthlyComparisons.length === 0">
           <i class="fa fa-chart-line"></i>
           <h3>No insights yet</h3>
           <p>Start logging your transactions to see advanced financial analysis and spending patterns here.</p>
        </div>

        <ng-container *ngIf="insights.monthlyComparisons.length > 0">


      <!-- Key Metrics Row -->
      <div class="insights__metrics">
        <div class="metric-card">
          <div class="metric-card__icon-wrap metric-card__icon-wrap--warning">
            <i class="fa fa-fire"></i>
          </div>
          <div class="metric-card__body">
            <span class="metric-card__label">Highest Spending</span>
            <h3 class="metric-card__value">{{ insights.highestSpendingCategory.category }}</h3>
            <span class="metric-card__sub">
              {{ insights.highestSpendingCategory.amount | currencyFormat }} · {{ insights.highestSpendingCategory.percentage }}%
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-card__icon-wrap metric-card__icon-wrap--success">
            <i class="fa fa-piggy-bank"></i>
          </div>
          <div class="metric-card__body">
            <span class="metric-card__label">Savings Rate</span>
            <h3 class="metric-card__value">{{ insights.savingsRate | number:'1.1-1' }}%</h3>
            <span class="metric-card__sub" [class.positive]="insights.savingsRate > 0" [class.negative]="insights.savingsRate <= 0">
              {{ insights.savingsRate > 20 ? 'Great' : insights.savingsRate > 0 ? 'Fair' : 'Needs attention' }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-card__icon-wrap metric-card__icon-wrap--info">
            <i class="fa fa-chart-line"></i>
          </div>
          <div class="metric-card__body">
            <span class="metric-card__label">Avg Monthly Income</span>
            <h3 class="metric-card__value">{{ insights.averageMonthlyIncome | currencyFormat }}</h3>
            <span class="metric-card__sub">Per month average</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-card__icon-wrap metric-card__icon-wrap--danger">
            <i class="fa fa-receipt"></i>
          </div>
          <div class="metric-card__body">
            <span class="metric-card__label">Avg Monthly Expenses</span>
            <h3 class="metric-card__value">{{ insights.averageMonthlyExpense | currencyFormat }}</h3>
            <span class="metric-card__sub">Per month average</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="insights__charts-row">
        <div class="insights__chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Monthly Comparison</h3>
            <p class="chart-subtitle">Income vs Expenses over time</p>
          </div>
          <div #monthlyChart class="chart-body"></div>
        </div>

        <div class="insights__chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Top Spending Categories</h3>
            <p class="chart-subtitle">Where your money goes</p>
          </div>
          <div #categoryBar class="chart-body"></div>
        </div>
      </div>

      <!-- Comparison Table -->
      <div class="insights__table-card">
        <div class="table-header">
          <h3 class="chart-title">Monthly Breakdown</h3>
          <p class="chart-subtitle">Detailed month-by-month analysis</p>
        </div>
        <div class="table-wrapper">
          <table class="insights-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Savings</th>
                <th>Savings Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let month of insights.monthlyComparisons" appHighlight>
                <td class="cell-month">{{ formatMonth(month.month) }}</td>
                <td class="cell-income">{{ month.income | currencyFormat }}</td>
                <td class="cell-expense">{{ month.expenses | currencyFormat }}</td>
                <td [class.positive]="month.savings >= 0" [class.negative]="month.savings < 0">
                  {{ month.savings | currencyFormat }}
                </td>
                <td>
                  <div class="progress-bar-wrap">
                    <div class="progress-bar" [style.width.%]="Math.max(0, Math.min(100, month.savingsRate))"
                      [class.progress-bar--good]="month.savingsRate > 20"
                      [class.progress-bar--fair]="month.savingsRate > 0 && month.savingsRate <= 20"
                      [class.progress-bar--bad]="month.savingsRate <= 0">
                    </div>
                    <span class="progress-label">{{ month.savingsRate | number:'1.0-0' }}%</span>
                  </div>
                </td>
                <td>
                  <span class="status-badge"
                    [class.status-badge--good]="month.savingsRate > 20"
                    [class.status-badge--fair]="month.savingsRate > 0 && month.savingsRate <= 20"
                    [class.status-badge--bad]="month.savingsRate <= 0">
                    {{ month.savingsRate > 20 ? 'Great' : month.savingsRate > 0 ? 'Fair' : 'Over budget' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div> <!-- table-wrapper -->
      </div> <!-- insights__table-card -->
    </ng-container>
  </div> <!-- insights -->
  `,
  styles: [`
    .insights { animation: fadeIn 0.4s ease; }
    .insights__header { 
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .insights__title {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 4px;
    }
    .insights__subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }

    .smart-insight {
      display: flex;
      align-items: center;
      gap: 16px;
      background: linear-gradient(135deg, rgba(20,130,196, 0.1), rgba(129, 140, 248, 0.05));
      border: 1px solid rgba(20,130,196, 0.2);
      border-radius: 16px;
      padding: 12px 20px;
      max-width: 450px;
      margin-left: 20px;
    }
    .smart-insight__icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #1482C4;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(20,130,196, 0.2);
    }
    .smart-insight__label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #1482C4;
      margin-bottom: 2px;
      display: block;
    }
    .smart-insight__text {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.4;
    }

    .empty-insights {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 80px 40px;
      text-align: center;
      box-shadow: var(--card-shadow);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: 20px;
    }
    .empty-insights i {
      font-size: 64px;
      color: var(--text-tertiary);
      margin-bottom: 24px;
      opacity: 0.5;
    }
    .empty-insights h3 {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 10px;
    }
    .empty-insights p {
      max-width: 400px;
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.6;
    }

    .insights__metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: var(--card-bg);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--card-border);
      transition: all 0.3s ease;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--card-shadow-hover);
    }
    .metric-card--highlight {
      background: linear-gradient(135deg, rgba(20,130,196,0.08), rgba(20,130,196,0.02));
      border-color: rgba(20,130,196,0.2);
    }
    .metric-card__icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .metric-card__icon-wrap--warning { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .metric-card__icon-wrap--success { background: rgba(16,185,129,0.12); color: #10b981; }
    .metric-card__icon-wrap--info { background: rgba(20,130,196,0.12); color: #1482C4; }
    .metric-card__icon-wrap--danger { background: rgba(239,68,68,0.12); color: #ef4444; }
    .metric-card__label { font-size: 12px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-card__value { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 4px 0; }
    .metric-card__sub { font-size: 12px; color: var(--text-secondary); }
    .metric-card__sub.positive { color: #10b981; }
    .metric-card__sub.negative { color: #ef4444; }
    .insights__charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .insights__chart-card {
      background: var(--card-bg);
      border-radius: 16px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--card-border);
      overflow: hidden;
    }
    .chart-header { padding: 20px 24px 0; }
    .chart-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; }
    .chart-subtitle { font-size: 12px; color: var(--text-tertiary); margin: 0; }
    .chart-body { padding: 16px; height: 280px; }
    .insights__table-card {
      background: var(--card-bg);
      border-radius: 16px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--card-border);
      overflow: hidden;
    }
    .table-header { padding: 20px 24px 16px; }
    .table-wrapper { overflow-x: auto; }
    .insights-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .insights-table th {
      text-align: left;
      padding: 12px 20px;
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--card-border);
      background: var(--bg-secondary);
    }
    .insights-table td {
      padding: 14px 20px;
      color: var(--text-primary);
      border-bottom: 1px solid var(--card-border);
    }
    .insights-table tr:last-child td { border-bottom: none; }
    .cell-month { font-weight: 600; }
    .cell-income { color: #10b981; font-weight: 500; }
    .cell-expense { color: #ef4444; font-weight: 500; }
    .positive { color: #10b981 !important; font-weight: 600; }
    .negative { color: #ef4444 !important; font-weight: 600; }
    .progress-bar-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .progress-bar {
      height: 6px;
      border-radius: 3px;
      min-width: 4px;
      max-width: 100px;
      transition: width 0.6s ease;
    }
    .progress-bar--good { background: linear-gradient(90deg, #10b981, #34d399); }
    .progress-bar--fair { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .progress-bar--bad { background: linear-gradient(90deg, #ef4444, #f87171); }
    .progress-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-badge--good { background: rgba(16,185,129,0.1); color: #10b981; }
    .status-badge--fair { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .status-badge--bad { background: rgba(239,68,68,0.1); color: #ef4444; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 1024px) {
      .insights__metrics { grid-template-columns: repeat(2, 1fr); }
      .insights__charts-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .insights__metrics { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsightsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('monthlyChart', { static: false }) monthlyChartEl!: ElementRef;
  @ViewChild('categoryBar', { static: false }) categoryBarEl!: ElementRef;

  insights$!: Observable<InsightData>;
  Math = Math;

  private destroy$ = new Subject<void>();
  private monthlyChartInstance: Highcharts.Chart | null = null;
  private categoryChartInstance: Highcharts.Chart | null = null;
  private insightsData: InsightData | null = null;

  constructor(
    private financeService: FinanceService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.insights$ = this.financeService.insights$;
  }

  ngAfterViewInit(): void {
    this.financeService.insights$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: InsightData) => {
        this.insightsData = data;
        setTimeout(() => this.renderCharts(data), 100);
      });

    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.insightsData) {
          setTimeout(() => this.renderCharts(this.insightsData!), 100);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.monthlyChartInstance) this.monthlyChartInstance.destroy();
    if (this.categoryChartInstance) this.categoryChartInstance.destroy();
  }

  formatMonth(month: string): string {
    const [year, m] = month.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }

  private renderCharts(data: InsightData): void {
    this.renderMonthlyChart(data.monthlyComparisons);
    this.renderCategoryBarChart(data.topExpenseCategories);
  }

  private renderMonthlyChart(comparisons: MonthlyComparison[]): void {
    if (!this.monthlyChartEl) return;

    const isDark = this.themeService.isDark;
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    if (this.monthlyChartInstance) this.monthlyChartInstance.destroy();

    this.monthlyChartInstance = Highcharts.chart(this.monthlyChartEl.nativeElement, {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        style: { fontFamily: "'Inter', sans-serif" },
        spacing: [10, 10, 10, 10]
      },
      title: { text: undefined },
      credits: { enabled: false },
      xAxis: {
        categories: comparisons.map(c => this.formatMonth(c.month)),
        labels: { style: { color: textColor, fontSize: '11px' } },
        lineColor: gridColor,
        tickColor: 'transparent'
      },
      yAxis: {
        title: { text: undefined },
        labels: {
          style: { color: textColor, fontSize: '11px' },
          formatter: function(this: Highcharts.AxisLabelsFormatterContextObject): string {
            const val = this.value as number;
            return '$' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val.toString());
          }
        },
        gridLineColor: gridColor,
        gridLineDashStyle: 'Dash' as Highcharts.DashStyleValue
      },
      legend: {
        itemStyle: { color: textColor, fontWeight: '500', fontSize: '12px' },
        itemHoverStyle: { color: isDark ? '#e5e7eb' : '#111827' },
        symbolRadius: 4
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderRadius: 12,
        style: { color: isDark ? '#e5e7eb' : '#111827', fontSize: '13px' }
      },
      plotOptions: {
        column: {
          borderRadius: 6,
          borderWidth: 0,
          groupPadding: 0.15,
          pointPadding: 0.05
        }
      },
      series: [
        {
          name: 'Income',
          type: 'column',
          data: comparisons.map(c => c.income),
          color: '#10b981'
        },
        {
          name: 'Expenses',
          type: 'column',
          data: comparisons.map(c => c.expenses),
          color: '#ef4444'
        },
        {
          name: 'Savings',
          type: 'column',
          data: comparisons.map(c => c.savings),
          color: '#1482C4'
        }
      ]
    });
  }

  private renderCategoryBarChart(categories: CategoryBreakdown[]): void {
    if (!this.categoryBarEl) return;

    const isDark = this.themeService.isDark;
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    if (this.categoryChartInstance) this.categoryChartInstance.destroy();

    this.categoryChartInstance = Highcharts.chart(this.categoryBarEl.nativeElement, {
      chart: {
        type: 'bar',
        backgroundColor: 'transparent',
        style: { fontFamily: "'Inter', sans-serif" },
        spacing: [10, 10, 10, 10]
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories: categories.map(c => c.category),
        labels: { style: { color: textColor, fontSize: '12px' } },
        lineColor: gridColor,
        tickColor: 'transparent'
      },
      yAxis: {
        title: { text: undefined },
        labels: {
          style: { color: textColor, fontSize: '11px' },
          formatter: function(this: Highcharts.AxisLabelsFormatterContextObject): string {
            const val = this.value as number;
            return '$' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val.toString());
          }
        },
        gridLineColor: gridColor,
        gridLineDashStyle: 'Dash' as Highcharts.DashStyleValue
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderRadius: 12,
        style: { color: isDark ? '#e5e7eb' : '#111827', fontSize: '13px' },
        pointFormat: '<b>${point.y:,.2f}</b> ({point.percentage:.0f}%)'
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          borderWidth: 0
        }
      },
      series: [{
        name: 'Amount',
        type: 'bar',
        data: categories.map(c => ({ y: c.amount, color: c.color }))
      }]
    });
  }
}
