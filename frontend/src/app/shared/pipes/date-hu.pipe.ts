import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateHu' })
export class DateHuPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: 'date' | 'datetime' = 'date'): string {
    if (!value) return '–';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '–';

    if (format === 'datetime') {
      return new Intl.DateTimeFormat('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }

    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }
}
