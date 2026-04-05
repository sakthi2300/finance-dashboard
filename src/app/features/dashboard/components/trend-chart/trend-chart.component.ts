import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import * as Highcharts from 'highcharts';
import { TrendDataPoint } from '../../../../core/models/transaction.model';
import { ThemeService } from '../../../../core/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-trend-chart',
  template: `<div #chartContainer class="trend-chart"></div>`,
  styles: [`
    .trend-chart {
      width: 100%;
      height: 320px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: TrendDataPoint[] = [];
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
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const bgColor = 'transparent';

    const categories = this.data.map(d => {
      const date = new Date(d.date + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = Highcharts.chart(this.chartContainer.nativeElement, {
      chart: {
        type: 'areaspline',
        backgroundColor: bgColor,
        style: { fontFamily: "'Inter', sans-serif" },
        spacing: [10, 10, 10, 10]
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: {
        align: 'right',
        verticalAlign: 'top',
        floating: true,
        itemStyle: { color: textColor, fontWeight: '500', fontSize: '12px' },
        itemHoverStyle: { color: isDark ? '#e5e7eb' : '#111827' },
        symbolRadius: 4
      },
      xAxis: {
        categories,
        labels: {
          style: { color: textColor, fontSize: '11px' },
          step: 2
        },
        lineColor: gridColor,
        tickColor: 'transparent',
        crosshair: {
          color: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
          width: 32
        }
      },
      yAxis: {
        title: { text: undefined },
        labels: {
          style: { color: textColor, fontSize: '11px' },
          formatter: function(this: Highcharts.AxisLabelsFormatterContextObject): string {
            const val = this.value as number;
            return '$' + (val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toString());
          }
        },
        gridLineColor: gridColor,
        gridLineDashStyle: 'Dash' as Highcharts.DashStyleValue
      },
      plotOptions: {
        areaspline: {
          fillOpacity: 0.08,
          lineWidth: 2.5,
          marker: {
            enabled: false,
            symbol: 'circle',
            radius: 4,
            states: {
              hover: { enabled: true, radius: 6, lineWidth: 2, lineColor: '#ffffff' }
            }
          },
          states: {
            hover: { lineWidth: 3 }
          }
        }
      },
      tooltip: {
        shared: true,
        formatter: function(this: any) {
          const points = this.points;
          const income = points.find((p: any) => p.series.name === 'Income').y;
          const expense = points.find((p: any) => p.series.name === 'Expenses').y;
          const avgIncome = 2000; // Heuristic for now
          
          let html = `<div style="font-weight:600;margin-bottom:8px;font-size:13px;">${this.x}</div>`;
          points.forEach((p: any) => {
            html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${p.series.color};display:inline-block;"></span>
                <span style="color:${textColor};font-size:12px;">${p.series.name}</span>
              </div>
              <span style="font-weight:700;font-size:13px;">$${p.y.toLocaleString()}</span>
            </div>`;
          });
          
          if (income > avgIncome * 1.5) {
            html += `<div style="margin-top:10px;padding-top:8px;border-top:1px solid ${gridColor};color:#10b981;font-size:11px;font-weight:600;">
              <i class="fa fa-info-circle"></i> High income spike detected
            </div>`;
          }
          return html;
        }
      },
      series: [
        {
          name: 'Income',
          type: 'areaspline',
          data: this.data.map(d => d.income),
          color: '#10b981',
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, 'rgba(16,185,129,0.20)'],
              [1, 'rgba(16,185,129,0.0)']
            ]
          } as unknown as string
        },
        {
          name: 'Expenses',
          type: 'areaspline',
          data: this.data.map(d => d.expense),
          color: '#ef4444',
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, 'rgba(239,68,68,0.15)'],
              [1, 'rgba(239,68,68,0.0)']
            ]
          } as unknown as string
        }
      ]
    });
  }
}
