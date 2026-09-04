import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = '₹'): string {
  if (typeof amount !== 'number' || isNaN(amount)) return `${currency}0`;
  return `${currency}${amount.toLocaleString('en-IN')}`;
}

export function formatDate(date: string | Date | undefined | null, fmt: 'short' | 'long' = 'short'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  if (fmt === 'long') return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function safeTruncate(str: string | undefined | null, len = 40): string {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
