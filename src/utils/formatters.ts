import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(iso: string, fmt = 'd MMM yyyy'): string {
  try {
    const d = parseISO(iso);
    if (!isValid(d)) return iso;
    return format(d, fmt, { locale: es });
  } catch {
    return iso;
  }
}

export function formatDateLong(iso: string): string {
  return formatDate(iso, "d 'de' MMMM 'de' yyyy");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function clsx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
