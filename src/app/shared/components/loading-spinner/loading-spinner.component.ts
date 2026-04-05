import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="spinner-overlay">
      <div class="spinner">
        <div class="spinner__ring"></div>
        <div class="spinner__ring"></div>
        <div class="spinner__ring"></div>
      </div>
      <p class="spinner__text">Loading data...</p>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }
    .spinner {
      position: relative;
      width: 48px;
      height: 48px;
    }
    .spinner__ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 3px solid transparent;
      border-radius: 50%;
      animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    }
    .spinner__ring:nth-child(1) {
      border-top-color: #1482C4;
      animation-delay: -0.3s;
    }
    .spinner__ring:nth-child(2) {
      border-top-color: #4AA8E2;
      animation-delay: -0.15s;
      width: 80%;
      height: 80%;
      top: 10%;
      left: 10%;
    }
    .spinner__ring:nth-child(3) {
      border-top-color: #a5b4fc;
      width: 60%;
      height: 60%;
      top: 20%;
      left: 20%;
    }
    .spinner__text {
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {}
