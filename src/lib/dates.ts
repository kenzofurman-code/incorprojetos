import { format, parseISO } from 'date-fns';

export function formatDate(value?: string): string {
  if (!value) return '-';
  try {
    return format(parseISO(value), 'dd/MM/yyyy');
  } catch {
    return value;
  }
}

export function formatDateTime(value?: string): string {
  if (!value) return '-';
  try {
    return format(parseISO(value), 'dd/MM/yyyy HH:mm');
  } catch {
    return value;
  }
}

export function todayIso(): string {
  return new Date().toISOString();
}
