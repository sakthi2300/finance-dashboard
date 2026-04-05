import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat'
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, symbol: string = '$', decimals: number = 2): string {
    if (value === null || value === undefined) return `${symbol}0.00`;
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return value < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  }
}
