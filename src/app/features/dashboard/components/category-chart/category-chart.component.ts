import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import * as Highcharts from 'highcharts';
import { CategoryBreakdown } from '../../../../core/models/transaction.model';
import { ThemeService } from '../../../../core/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-category-chart',
  template: `
    <div class="category-chart-wrapper">
      <div #chartContainer class="category-chart"></div>
      <div class="category-legend" *ngIf="data.length > 0">
        <div class="legend-item" *ngFor="let item of data">
          <span class="legend-dot" [style.background]="item.color"></span>
          <span class="legend-label">{{ item.category }}</span>
          <span class="legend-value">{{ item.percentage }}%</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .category-chart-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .category-chart {
      width: 100%;
      height: 250px;
    }
    .category-legend {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 0 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      padding: 6px 10px;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .legend-item:hover {
      background: var(--bg-secondary);
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .legend-label {
      color: var(--text-secondary);
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .legend-value {
      font-weight: 600;
      color: var(--text-primary);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: CategoryBreakdown[] = [];
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  private chart: Highcharts.Chart | null = null;
  private themeSub!: Subscription;

  constructor(private themeService: ThemeService) {}

  ngAfterViewInit(): void {
    this.themeSub = this.themeService.theme$.subscribe(() => {
      setTimeout(() => this.renderChart(), 0);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chartContainer) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    if (this.themeSub) {
      this.themeSub.unsubscribe();
    }
  }

  private renderChart(): void {
    if (!this.chartContainer || !this.data.length) return;

    const isDark = this.themeService.isDark;
    const textColor = isDark ? '#9ca3af' : '#6b7280';

    if (this.chart) {
      this.chart.destroy();
    }

    const totalAmount = this.data.reduce((sum, item) => sum + item.amount, 0);
    const mainCategory = this.data.length > 0 ? this.data[0].category : '';

    this.chart = Highcharts.chart(this.chartContainer.nativeElement, {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        style: { fontFamily: "'Inter', sans-serif" }
      },
      title: {
        text: `<div style="text-align:center"><span style="font-size: 11px; font-weight: 500; color: ${textColor}; text-transform: uppercase; letter-spacing: 0.5px">Total</span><br/><span style="font-size: 20px; font-weight: 700; color: ${isDark ? '#fff' : '#111827'}">$${(totalAmount / 1000).toFixed(1)}k</span></div>`,
        align: 'center',
        verticalAlign: 'middle',
        y: 0,
        useHTML: true
      },
      credits: { enabled: false },
      legend: { enabled: false },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderRadius: 12,
        style: { color: isDark ? '#e5e7eb' : '#111827', fontSize: '13px' },
        pointFormat: '<b>{point.name}</b><br/>Amount: <b>${point.y:,.2f}</b><br/>Share: <b>{point.percentage:.1f}%</b>'
      },
      plotOptions: {
        pie: {
          innerSize: '75%',
          borderWidth: 2,
          borderColor: isDark ? '#1f2937' : '#ffffff',
          dataLabels: { enabled: false },
          showInLegend: false,
          cursor: 'pointer',
          states: {
            hover: {
              brightness: 0.05,
              halo: { size: 8, opacity: 0.2 }
            }
          }
        }
      },
      series: [{
        name: 'Expenses',
        type: 'pie',
        data: this.data.map(item => ({
          name: item.category,
          y: item.amount,
          color: item.color
        }))
      }]
    });
  }
}
