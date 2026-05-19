import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyHu' })
export class CurrencyHuPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'HUF'): string {
    if (value === null || value === undefined) return '–';
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
