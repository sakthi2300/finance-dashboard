import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-summary-card',
  template: `
    <div class="summary-card" [class]="'summary-card--' + variant">
      <div class="summary-card__content">
        <span class="summary-card__label">{{ label }}</span>
        <h2 class="summary-card__value">{{ prefix }}{{ formattedValue }}</h2>
        <div class="summary-card__change" *ngIf="change !== null">
          <span [class.positive]="change >= 0" [class.negative]="change < 0">
            <i class="fa" [class.fa-arrow-up]="change >= 0" [class.fa-arrow-down]="change < 0"></i>
            {{ change >= 0 ? '+' : '' }}{{ change }}%
          </span>
          <span class="summary-card__period">vs last month</span>
        </div>
      </div>
      <div class="summary-card__icon">
        <i class="fa {{ icon }}"></i>
      </div>
    </div>
  `,
  styles: [`
    .summary-card {
      background: var(--card-bg);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      box-shadow: var(--card-shadow);
      transition: all 0.3s ease;
      border: 1px solid var(--card-border);
      position: relative;
      overflow: hidden;
    }
    .summary-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      border-radius: 16px 16px 0 0;
    }
    .summary-card--balance::before { background: linear-gradient(90deg, #1482C4, #4AA8E2); }
    .summary-card--income::before { background: linear-gradient(90deg, #10b981, #34d399); }
    .summary-card--expense::before { background: linear-gradient(90deg, #ef4444, #f87171); }
    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--card-shadow-hover);
    }
    .summary-card__content { flex: 1; }
    .summary-card__label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-card__value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 8px 0;
      letter-spacing: -0.5px;
    }
    .summary-card__change {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }
    .summary-card__change .positive {
      color: #10b981;
      font-weight: 600;
    }
    .summary-card__change .negative {
      color: #ef4444;
      font-weight: 600;
    }
    .summary-card__change .positive i,
    .summary-card__change .negative i { font-size: 11px; }
    .summary-card__period {
      color: var(--text-tertiary);
      font-size: 12px;
    }
    .summary-card__icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .summary-card--balance .summary-card__icon {
      background: rgba(20,130,196, 0.12);
      color: #1482C4;
    }
    .summary-card--income .summary-card__icon {
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
    }
    .summary-card--expense .summary-card__icon {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryCardComponent {
  @Input() label = '';
  @Input() value = 0;
  @Input() prefix = '$';
  @Input() change: number | null = null;
  @Input() icon = 'fa-wallet';
  @Input() variant: 'balance' | 'income' | 'expense' = 'balance';

  get formattedValue(): string {
    return Math.abs(this.value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
