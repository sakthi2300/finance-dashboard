import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat'
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | null | undefined, format: 'short' | 'medium' | 'long' = 'medium'): string {
    if (!value) return '';
    const date = new Date(value + 'T00:00:00');
    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'long':
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      case 'medium':
      default:
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }
}
